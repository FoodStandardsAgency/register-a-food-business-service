"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { sendNotifications } = require("../../services/notifications.service");
const { isEmpty } = require("lodash");
const { success } = require("../../utils/express/response");
const HttpsProxyAgent = require("https-proxy-agent");
const axios = require("axios");

const {
  sendTascomiRegistration,
  getLcContactConfigFromArray
} = require("../submissions/submissions.service");

const {
  findOneById,
  updateStatusInCache,
  findOutstandingTascomiRegistrationsFsaIds,
  findAllBlankRegistrations,
  findAllFailedNotificationsRegistrations,
  findAllTmpRegistrations
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
  getAllLocalCouncilConfig
} = require("../../connectors/configDb/configDb.connector");

const {
  TASCOMI_SUCCESS,
  TASCOMI_SKIPPING,
  TASCOMI_FAIL
} = require("../../connectors/tascomi/tascomi.connector");
const {
  establishConnectionToCosmos
} = require("../../connectors/cosmos.client");
const { RNG_API_URL } = require("../../config");

const sendAllOutstandingRegistrationsToTascomiAction = async (
  req,
  res,
  dryrun,
  throttle = 0
) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
    "sendAllOutstandingRegistrationsToTascomiAction"
  );
  let registrationsCollection = await establishConnectionToCosmos(
    "registrations",
    "registrations"
  );
  let registrations = await findOutstandingTascomiRegistrationsFsaIds(
    registrationsCollection
  );
  registrations = await registrations.toArray();
  let idsAttempted = [];
  let allLcConfigData = await getAllLocalCouncilConfig();
  let registration;

  for (let i = 0; i < registrations.length; i++) {
    registration = registrations[i];
    idsAttempted.push(registration["fsa-rn"]);

    if (!dryrun) {
      await multiSendRegistrationToTascomi(registration, allLcConfigData);
    }

    //sleep
    await new Promise((resolve) => setTimeout(resolve, throttle));

    logEmitter.emit(
      INFO,
      `Sent tascomi registrations for FSAId ${registration["fsa-rn"]}`
    );
  }

  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
    "sendAllOutstandingRegistrationsToTascomiAction"
  );

  await success(res, {
    message: `Updated tascomi registration status`,
    attempted: idsAttempted,
    dryrun,
    throttle
  });
};

//actions
const sendRegistrationToTascomiAction = async (fsaId, req, res) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
    "sendRegistrationToTascomiAction"
  );
  //GET REGISTRATION
  let cachedRegistrations = await establishConnectionToCosmos(
    "registrations",
    "registrations"
  );
  let registration = await findOneById(cachedRegistrations, fsaId);
  let allLcConfigData = await getAllLocalCouncilConfig();

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

  // DO LOOK UP
  if (localCouncil.auth) {
    try {
      //GOT AUTH DATA
      await sendTascomiRegistration(registration, localCouncil);

      //SUCCESS
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_SUCCESS);
    } catch (e) {
      //FAIL
      logEmitter.emit(
        ERROR,
        `Could not push to tascomi for ${fsaId} and local council ${localCouncil._id}. Error: "${e.message}"`
      );
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_FAIL);
    }
  } else {
    //NOT APPLICABLE - nothing to update
    await updateStatusInCache(fsaId, "tascomi", TASCOMI_SKIPPING);
  }

  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
    "sendRegistrationToTascomiAction"
  );

  await success(res, { fsaId, message: `Updated tascomi registration status` });
};

const sendAllNotificationsForRegistrationsAction = async (
  req,
  res,
  dryrun,
  throttle = 0
) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
    "sendAllNotificationsForRegistrationsAction"
  );
  let idsAttempted = [];
  let registrationsCollection = await establishConnectionToCosmos(
    "registrations",
    "registrations"
  );

  //we have to do these 3 look ups as a workaround for azure cosmos shortcoming
  let registrations = await findAllBlankRegistrations(registrationsCollection);
  registrations = await registrations.toArray();

  let failedRegistrations = await findAllFailedNotificationsRegistrations(
    registrationsCollection
  );
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

      logEmitter.emit(
        INFO,
        `Sent notifications for FSAId ${registration["fsa-rn"]}`
      );
    } else {
      logEmitter.emit(
        INFO,
        `Pretended to send notifications for FSAId ${registration["fsa-rn"]}`
      );
    }
  }

  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
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
  const typeCode = process.env.NODE_ENV === "production" ? "001" : "000";
  const councilCode = registration.hygiene_council_code || "1234";
  let fsa_rn;
  try {
    const options = {
      validateStatus: () => {
        return true;
      }
    };
    if (process.env.HTTP_PROXY) {
      options.httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      // https://github.com/axios/axios/issues/2072#issuecomment-609650888
      options.proxy = false;
    }
    const fsaRnResponse = await axios(
      `${RNG_API_URL}/generate/${councilCode}/${typeCode}`,
      options
    );
    if (fsaRnResponse.status === 200) {
      // get registration
      fsa_rn = fsaRnResponse.data["fsa-rn"];
      const cachedRegistrations = await establishConnectionToCosmos(
        "registrations",
        "registrations"
      );
      logEmitter.emit(
        "functionCall",
        "tryResolveRegistrationNumber",
        "update`fsa-rn`"
      );
      try {
        // update fsa-rn
        await cachedRegistrations.updateOne(
          { "fsa-rn": registration["fsa-rn"] },
          {
            $set: { "fsa-rn": fsa_rn }
          }
        );
        logEmitter.emit(
          "functionSuccess",
          "tryResolveRegistrationNumber",
          "update`fsa-rn"
        );
        return fsa_rn;
      } catch (err) {
        logEmitter.emit(
          "functionFail",
          "tryResolveRegistrationNumber",
          "update`fsa-rn",
          err
        );
        return false;
      }
    }
    return false;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "tryResolveRegistrationNumber",
      "get `fsa-rn",
      err
    );
    return false;
  }
};

const sendNotificationsForRegistrationAction = async (fsaId, req, res) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
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

  let configVersion = registration.registration_data_version
    ? registration.registration_data_version
    : "1.7.0";
  let config = await getConfig(configVersion);
  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
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

  await sendNotifications(fsaId, lcContactConfig, registration, config);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);
  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
    "sendNotificationsForRegistrationAction"
  );

  await success(res, { fsaId, message: `Updated notifications status` });
};

// Convenience methods for this controller - dont put else where
const multiSendNotifications = async (registration, allLocalCouncils) => {
  let fsaId = registration["fsa-rn"];

  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = await findCouncilByIdInArray(
    localCouncilId,
    allLocalCouncils
  );
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  let configVersion = registration.registration_data_version
    ? registration.registration_data_version
    : "1.7.0";
  let config = await getConfig(configVersion);

  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
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

  await sendNotifications(fsaId, lcContactConfig, registration, config);
};

const multiSendRegistrationToTascomi = async (
  registration,
  allLcConfigData
) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
    "multiSendRegistrationToTascomi"
  );
  let fsaId = registration["fsa-rn"];

  let councilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(councilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${councilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  // DO LOOK UP
  if (localCouncil.auth) {
    try {
      //GOT AUTH DATA
      await sendTascomiRegistration(registration, localCouncil);

      //SUCCESS
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_SUCCESS);
    } catch (e) {
      //FAIL
      logEmitter.emit(
        ERROR,
        `Could not push to tascomi for ${fsaId} and local council ${localCouncil._id}. Error: "${e.message}"`
      );
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_FAIL);
    }
  } else {
    //NOT APPLICABLE - nothing to update
    await updateStatusInCache(fsaId, "tascomi", TASCOMI_SKIPPING);
  }

  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
    "multiSendRegistrationToTascomi"
  );
};

const getConfig = async (configVersion) => {
  logEmitter.emit("functionCall", "Tasks.controller", "getConfig");
  let configCollection = await establishConnectionToCosmos(
    "config",
    "configVersion"
  );
  logEmitter.emit("functionSuccess", "Tasks.controller", "getConfig");
  return await configCollection.findOne({ _id: configVersion });
};

const getRegistration = async (fsaId) => {
  logEmitter.emit("functionCall", "Tasks.controller", "getRegistration");
  const cachedRegistrations = await establishConnectionToCosmos(
    "registrations",
    "registrations"
  );
  logEmitter.emit("functionSuccess", "Tasks.controller", "getRegistration");
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
  logEmitter.emit("functionCall", "Tasks.controller", "findCouncilByIdInArray");
  let out = allCouncils.find((council) => council._id === id);
  logEmitter.emit(
    "functionSuccess",
    "Tasks.controller",
    "findCouncilByIdInArray"
  );
  return out;
};

const getLocalCouncilIdForRegistration = (registration) => {
  logEmitter.emit(
    "functionCall",
    "Tasks.controller",
    "getLocalCouncilIdForRegistration"
  );
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
    "Tasks.controller",
    "getLocalCouncilIdForRegistration"
  );

  return councilId;
};

module.exports = {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  tryResolveRegistrationNumber
};
