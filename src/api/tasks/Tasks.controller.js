"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { sendNotifications } = require("../../services/notifications.service");
const { isEmpty } = require("lodash");
const { success } = require("../../utils/express/response");

const {
  saveRegistration,
  sendTascomiRegistration,
  getLcContactConfigFromArray,
} = require("../registration/registration.service");

const {
  connectToBeCacheDb,
  CachedRegistrationsCollection,
  findOneById,
  updateStatusInCache,
  findAllOutstandingSavesToTempStore,
  findOutstandingTascomiRegistrationsFsaIds,
  findAllBlankRegistrations,
  findAllFailedNotificationsRegistrations,
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
  getAllLocalCouncilConfig,
  connectToConfigDb,
  ConfigVersionCollection,
} = require("../../connectors/configDb/configDb.connector");

const {
  TASCOMI_SUCCESS,
  TASCOMI_SKIPPING,
  TASCOMI_FAIL,
} = require("../../connectors/tascomi/tascomi.connector");

const sendAllOutstandingRegistrationsToTascomiAction = async (
  req,
  res,
  dryrun,
  throttle = 0
) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);
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
      await multiSendRegistrationToTascomi(
        configDb,
        registration,
        allLcConfigData
      );
    }

    //sleep
    await new Promise((resolve) => setTimeout(resolve, throttle));

    logEmitter.emit(
      INFO,
      `Sent tascomi registrations for FSAId ${registration["fsa-rn"]}`
    );
  }

  await success(res, {
    message: `Updated tascomi registration status`,
    attempted: idsAttempted,
    dryrun,
    throttle,
  });
};

//actions
const sendRegistrationToTascomiAction = async (fsaId, req, res) => {
  //GET REGISTRATION
  let beCacheDb = await connectToBeCacheDb();
  let cachedRegistrations = await CachedRegistrationsCollection(beCacheDb);
  let registration = await findOneById(cachedRegistrations, fsaId);
  let allLcConfigData = await getAllLocalCouncilConfig();

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);
  //GET LOCAL COUNCIL
  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(localCouncilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
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

  await success(res, { fsaId, message: `Updated tascomi registration status` });
};

const sendAllNotificationsForRegistrationsAction = async (
  req,
  res,
  dryrun,
  throttle = 0
) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let idsAttempted = [];
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);

  //we have to do these 2 look ups as a workaround for azure cosmos shortcoming
  let registrations = await findAllFailedNotificationsRegistrations(
    registrationsCollection
  );
  registrations = await registrations.toArray();

  let blankRegistrations = await findAllBlankRegistrations(
    registrationsCollection
  );
  blankRegistrations = await blankRegistrations.toArray();

  for (let i = 0; i < blankRegistrations.length; i++) {
    registrations.push(blankRegistrations[i]);
  }

  let allLcConfigData = await getAllLocalCouncilConfig();
  let registration;

  for (let i = 0; i < registrations.length; i++) {
    registration = registrations[i];
    idsAttempted.push(registration["fsa-rn"]);

    if (!dryrun) {
      await multiSendNotifications(configDb, registration, allLcConfigData);
    }

    //sleep
    await new Promise((resolve) => setTimeout(resolve, throttle));

    logEmitter.emit(
      INFO,
      `Sent notifications for FSAId ${registration["fsa-rn"]}`
    );
  }

  await success(res, {
    message: `Updated notification status`,
    attempted: idsAttempted,
    dryrun,
    throttle,
  });
};

const sendNotificationsForRegistrationAction = async (fsaId, req, res) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let allLcConfigData = await getAllLocalCouncilConfig();

  //GET REGISTRATION
  let registration = await getRegistration(beCacheDb, fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(localCouncilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  let configVersion = registration.registration_data_version
    ? registration.registration_data_version
    : "1.7.0";
  let config = await getConfig(configDb, configVersion);
  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLcConfigData
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find local council config ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await sendNotifications(fsaId, lcContactConfig, registration, config);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);

  await success(res, { fsaId, message: `Updated notifications status` });
};

const saveAllOutstandingRegistrationsToTempStoreAction = async (
  req,
  res,
  dryrun,
  throttle = 0
) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let idsAttempted = [];
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);
  let registrations = await findAllOutstandingSavesToTempStore(
    registrationsCollection
  );
  registrations = await registrations.toArray();
  let allLcConfigData = await getAllLocalCouncilConfig();
  let registration;

  for (let i = 0; i < registrations.length; i++) {
    registration = registrations[i];
    idsAttempted.push(registration["fsa-rn"]);

    if (!dryrun) {
      await multiSaveRegistrationsToTempStore(
        configDb,
        registration,
        allLcConfigData
      );
    }

    //sleep
    await new Promise((resolve) => setTimeout(resolve, throttle));

    logEmitter.emit(
      INFO,
      `Saved registration to temp-store for FSAId ${registration["fsa-rn"]}`
    );
  }

  await success(res, {
    message: `Updated temp-store`,
    attempted: idsAttempted,
    dryrun,
    throttle,
  });
};

const saveRegistrationToTempStoreAction = async (fsaId, req, res) => {
  const beCacheDb = await connectToBeCacheDb();
  let allLcConfigData = await getAllLocalCouncilConfig();

  //GET REGISTRATION
  let registration = await getRegistration(beCacheDb, fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let councilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(councilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${councilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await saveRegistration(registration, fsaId, localCouncil.local_council_url);

  await success(res, { fsaId, message: `Updated temp-store status` });
};

// Convenience methods for this controller - dont put else where
const multiSendNotifications = async (
  configDb,
  registration,
  allLocalCouncils
) => {
  let fsaId = registration["fsa-rn"];

  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = await findCouncilByIdInArray(
    localCouncilId,
    allLocalCouncils
  );
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  let configVersion = registration.registration_data_version
    ? registration.registration_data_version
    : "1.7.0";
  let config = await getConfig(configDb, configVersion);

  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLocalCouncils
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find lcContactConfig ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await sendNotifications(fsaId, lcContactConfig, registration, config);
};

const multiSendRegistrationToTascomi = async (
  configDb,
  registration,
  allLcConfigData
) => {
  let fsaId = registration["fsa-rn"];

  let councilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(councilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${councilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
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
};

const multiSaveRegistrationsToTempStore = async (
  configDb,
  registration,
  allLocalCouncils
) => {
  let fsaId = registration["fsa-rn"];

  //GET LOCAL COUNCIL
  let councilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(councilId, allLocalCouncils);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${councilId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await saveRegistration(registration, fsaId, localCouncil.local_council_url);
};

const getConfig = async (client, configVersion) => {
  let configCollection = await ConfigVersionCollection(client);
  return await configCollection.findOne({ _id: configVersion });
};

const getRegistration = async (client, fsaId) => {
  const cachedRegistrations = await CachedRegistrationsCollection(client);
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
  let out = allCouncils.find((council) => council._id === id);
  return out;
};

const getLocalCouncilIdForRegistration = (registration) => {
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

  return councilId;
};

module.exports = {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction,
};
