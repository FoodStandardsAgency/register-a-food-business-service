"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { sendNotifications } = require("../../services/notifications.service");
const { isEmpty } = require("lodash");
const { success } = require("../../utils/express/response");
const { getFsaRn } = require("../../services/submissions.service");

const { getLcContactConfigFromArray } = require("../../services/submissions.service");

const {
  findAllBlankRegistrations,
  findAllFailedNotificationsRegistrations
} = require("../../connectors/notificationsDb/notificationsDb.connector");

const {
  findOneById,
  findAllTmpRegistrations
} = require("../../connectors/submissionsDb/submissionsDb.connector");

const { getAllLocalCouncilConfig } = require("../../connectors/configDb/configDb.connector");

const { establishConnectionToCosmos } = require("../../connectors/cosmos.client");

//actions

const sendAllNotificationsForRegistrationsAction = async (req, res, dryrun, throttle = 0) => {
  logEmitter.emit(
    "functionCall",
    "notifications.controller",
    "sendAllNotificationsForRegistrationsAction"
  );
  let idsAttempted = [];
  let registrationsCollection = await establishConnectionToCosmos("registrations", "registrations");

  /* Blank i.e. new registrations, failed registrations (or ones that have been updated to resend)
and registrations with temporary reference IDs are all queried separately. This was originally due to a
workaround for an Azure Cosmos shortcoming but has the fortunate effect that bulk updates to existing emails
or large numbers of registrations with temporary reference IDs will not interfere with the processing of new
registrations. A limit of 100 is returned for each of the three types, which seems to keep the processing well
within the 5 minute window before the next batch begins.  */
  let registrations = await findAllBlankRegistrations(registrationsCollection);
  registrations = await registrations.toArray();

  let failedRegistrations = await findAllFailedNotificationsRegistrations(registrationsCollection);
  failedRegistrations = await failedRegistrations.toArray();

  for (let reg of failedRegistrations) {
    registrations.push(reg);
  }
  let tmpRegistrations = await findAllTmpRegistrations(registrationsCollection);
  tmpRegistrations = await tmpRegistrations.toArray();

  for (let reg of tmpRegistrations) {
    registrations.push(reg);
  }

  let allLcConfigData = await getAllLocalCouncilConfig();
  let registration;

  for (let i = 0; i < registrations.length; i++) {
    registration = registrations[i];
    if (!registration["fsa-rn"]) {
      logEmitter.emit(ERROR, "sendAllNotificationsForRegistrationsAction missing fsa-rn");
      continue;
    }
    idsAttempted.push(registration["fsa-rn"]);

    if (!dryrun) {
      if (registration["fsa-rn"].startsWith("tmp_")) {
        // Try resolve RNG
        const newRn = await tryResolveRegistrationNumber(registration);
        if (newRn) {
          registration["fsa-rn"] = newRn;
        }
      }

      await multiSendNotifications(registration, allLcConfigData);

      //sleep
      await new Promise((resolve) => setTimeout(resolve, throttle));

      logEmitter.emit(INFO, `Sent notifications for FSAId ${registration["fsa-rn"]}`);
    } else {
      logEmitter.emit(INFO, `Pretended to send notifications for FSAId ${registration["fsa-rn"]}`);
    }
  }

  logEmitter.emit(
    "functionSuccess",
    "notifications.controller",
    "sendAllNotificationsForRegistrationsAction"
  );
  await success(res, {
    message: `Updated notification status`,
    attempted: idsAttempted,
    dryrun,
    throttle
  });
};

const tryResolveRegistrationNumber = async (registration) => {
  const councilCode = registration.hygiene_council_code || "1234";

  const fsa_rn = await getFsaRn(councilCode);
  if (fsa_rn) {
    try {
      // update fsa-rn
      const cachedRegistrations = await establishConnectionToCosmos(
        "registrations",
        "registrations"
      );
      logEmitter.emit("functionCall", "tryResolveRegistrationNumber", "update`fsa-rn`");

      await cachedRegistrations.updateOne(
        { "fsa-rn": registration["fsa-rn"] },
        {
          $set: { "fsa-rn": fsa_rn }
        }
      );
      logEmitter.emit("functionSuccess", "tryResolveRegistrationNumber", "update`fsa-rn");
      return fsa_rn;
    } catch (err) {
      logEmitter.emit("functionFail", "tryResolveRegistrationNumber", "update`fsa-rn", err);
      return false;
    }
  }
  return false;
};

const sendNotificationsForRegistrationAction = async (fsaId, req, res) => {
  logEmitter.emit(
    "functionCall",
    "notifications.controller",
    "sendNotificationsForRegistrationAction"
  );
  let allLcConfigData = await getAllLocalCouncilConfig();

  //GET REGISTRATION
  let registration = await getRegistration(fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(localCouncilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLcConfigData
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find local council config ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  await sendNotifications(fsaId, lcContactConfig, registration);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);
  logEmitter.emit(
    "functionSuccess",
    "notifications.controller",
    "sendNotificationsForRegistrationAction"
  );

  await success(res, { fsaId, message: `Updated notifications status` });
};

// Convenience methods for this controller - dont put else where
const multiSendNotifications = async (registration, allLocalCouncils) => {
  let fsaId = registration["fsa-rn"];

  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = await findCouncilByIdInArray(localCouncilId, allLocalCouncils);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLocalCouncils
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find lcContactConfig ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  await sendNotifications(fsaId, lcContactConfig, registration);
};

const getRegistration = async (fsaId) => {
  logEmitter.emit("functionCall", "notifications.controller", "getRegistration");
  const cachedRegistrations = await establishConnectionToCosmos("registrations", "registrations");
  logEmitter.emit("functionSuccess", "notifications.controller", "getRegistration");
  return await findOneById(cachedRegistrations, fsaId);
};

// const getCouncilFromConfigDb = async (client, registration) => {
//   //this is a strange nasty hack to extract the council id of the initial registration for older records
//   const lcConfigCollection = await LocalCouncilConfigDbCollection(client);
//   let councilId;
//   if (registration.source_council_id) {
//     // POST feature RS-79
//     councilId = registration.source_council_id;
//   } else {
//     // PRE feature RS-79
//     councilId = registration.hygieneAndStandards
//       ? registration.hygieneAndStandards.code
//       : registration.hygiene.code;
//   }
//
//   //can return null
//   return await findCouncilById(lcConfigCollection, councilId);
// };

const findCouncilByIdInArray = (id, allCouncils = []) => {
  logEmitter.emit("functionCall", "notifications.controller", "findCouncilByIdInArray");
  let out = allCouncils.find((council) => council._id === id);
  logEmitter.emit("functionSuccess", "notifications.controller", "findCouncilByIdInArray");
  return out;
};

const getLocalCouncilIdForRegistration = (registration) => {
  logEmitter.emit("functionCall", "notifications.controller", "getLocalCouncilIdForRegistration");
  let councilId;

  if (registration.source_council_id) {
    // POST feature RS-79
    councilId = registration.source_council_id;
  } else {
    // PRE feature RS-79
    councilId = registration.hygieneAndStandards
      ? registration.hygieneAndStandards.code
      : registration.hygiene.code;
  }

  logEmitter.emit(
    "functionSuccess",
    "notifications.controller",
    "getLocalCouncilIdForRegistration"
  );

  return councilId;
};

module.exports = {
  sendNotificationsForRegistrationAction,
  sendAllNotificationsForRegistrationsAction,
  tryResolveRegistrationNumber
};
