"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { sendNotifications } = require("../../services/notifications.service");
const { isEmpty } = require("lodash");
const { success } = require("../../utils/express/response");

const {
  saveRegistration,
  sendTascomiRegistration
} = require("../registration/registration.service");

const {
  connectToBeCacheDb,
  disconnectCacheDb,
  CachedRegistrationsCollection,
  findOneById,
  updateStatusInCache,
  findOutstandingTascomiRegistrationsFsaIds,
  findAllOutstandingNotificationsRegistrations
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
  findCouncilById,
  connectToConfigDb,
  ConfigVersionCollection,
  LocalCouncilConfigDbCollection
} = require("../../connectors/configDb/configDb.connector");

const {
  TASCOMI_SUCCESS,
  TASCOMI_SKIPPING,
  TASCOMI_FAIL
} = require("../../connectors/tascomi/tascomi.connector");

const sendAllOutstandingRegistrationsToTascomiAction = async (req, res) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);
  let ids = await findOutstandingTascomiRegistrationsFsaIds(
    registrationsCollection
  );
  let fsaId;

  ids.forEach(async registration => {
    idsAttempted.push(registration["fsa-rn"]);
    await (await multiSendRegistrationToTascomi(configDb))(registration);
    logEmitter.emit(INFO, `Sent tascomi registraions for FSAId ${fsaId}`);
  });

  await success(res, {
    fsaId,
    message: `Updated tascomi registration status`,
    attempted: idsAttempted
  });
};

//actions
const sendRegistrationToTascomiAction = async (fsaId, req, res) => {
  //GET REGISTRATION
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let cachedRegistrations = await CachedRegistrationsCollection(beCacheDb);
  let registration = await findOneById(cachedRegistrations, fsaId);
  let idsAttempted = [];

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);
  //GET LOCAL COUNCIL
  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  // DO LOOK UP
  if (localCouncil.auth) {
    try {
      //GOT AUTH DATA
      let response = await sendTascomiRegistration(registration, localCouncil);

      //SUCCESS
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_SUCCESS);
    } catch (e) {
      //FAIL
      logEmitter.emit(
        ERROR,
        `Could not push to tascomi for ${fsaId} and local council ${
          localCouncil._id
        }. Error: "${err}"`
      );
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_FAIL);
    }
  } else {
    //NOT APPLICABLE - nothing to update
    await updateStatusInCache(fsaId, "tascomi", TASCOMI_SKIPPING);
  }

  await success(res, { fsaId, message: `Updated tascomi registration status` });
};

const sendAllNotificationsForRegistrationsAction = async (req, res) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let idsAttempted = [];
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);
  let ids = await findAllOutstandingNotificationsRegistrations(
    registrationsCollection
  );
  let fsaId;

  ids.forEach(async registration => {
    idsAttempted.push(registration["fsa-rn"]);
    await (await multiSendNotifications(configDb))(registration);
    logEmitter.emit(INFO, `Sent notifications for FSAId ${fsaId}`);
  });

  await success(res, {
    fsaId,
    message: `Updated notification status`,
    attempted: idsAttempted
  });
};

const sendNotificationsForRegistrationAction = async (fsaId, req, res) => {
  const beCacheDb = await connectToBeCacheDb();
  const configDb = await connectToConfigDb();

  //GET REGISTRATION
  let registration = await getRegistration(beCacheDb, fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  let configVersion = registration.registrationDataVersion
    ? registration.registrationDataVersion
    : "1.6.0";
  let config = await getConfig(configDb, configVersion);

  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await sendNotifications(fsaId, localCouncil, registration, config);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);

  await success(res, { fsaId, message: `Updated notifications status` });
};

const saveAllOutstandingRegistrationsToTempStoreAction = async (req, res) => {
  let beCacheDb = await connectToBeCacheDb();
  let configDb = await connectToConfigDb();
  let idsAttempted = [];
  let registrationsCollection = await CachedRegistrationsCollection(beCacheDb);
  let ids = await findAllOutstandingNotificationsRegistrations(
    registrationsCollection
  );
  let fsaId;

  ids.forEach(async registration => {
    idsAttempted.push(registration["fsa-rn"]);
    await (await multiSaveRegistrationsToTempStore(configDb))(registration);
    logEmitter.emit(INFO, `Sent notifications for FSAId ${fsaId}`);
  });

  await success(res, {
    fsaId,
    message: `Updated temp-store`,
    attempted: idsAttempted
  });
};

const saveRegistrationToTempStoreAction = async (fsaId, req, res) => {
  const beCacheDb = await connectToBeCacheDb();

  const configDb = await connectToConfigDb();

  //GET REGISTRATION
  let registration = await getRegistration(beCacheDb, fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await saveRegistration(registration, fsaId, localCouncil.local_council_url);

  await success(res, { fsaId, message: `Updated temp-store status` });
};

// Convenience methods for this controller - dont put else where
const multiSendNotifications = async configDb => async registration => {
  let fsaId = registration["fsa-rn"];

  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  let configVersion = registration.registrationDataVersion
    ? registration.registrationDataVersion
    : "1.6.0";
  let config = await getConfig(configDb, configVersion);

  if (isEmpty(config)) {
    let message = `Could not find config ${fsaId} version : ${configVersion}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  await sendNotifications(fsaId, localCouncil, registration, config);
};

const multiSendRegistrationToTascomi = async configDb => async registration => {
  let fsaId = registration["fsa-rn"];

  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw message;
  }

  // DO LOOK UP
  if (localCouncil.auth) {
    try {
      //GOT AUTH DATA
      let response = await sendTascomiRegistration(registration, localCouncil);

      //SUCCESS
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_SUCCESS);
    } catch (e) {
      //FAIL
      logEmitter.emit(
        ERROR,
        `Could not push to tascomi for ${fsaId} and local council ${
          localCouncil._id
        }. Error: "${err}"`
      );
      await updateStatusInCache(fsaId, "tascomi", TASCOMI_FAIL);
    }
  } else {
    //NOT APPLICABLE - nothing to update
    await updateStatusInCache(fsaId, "tascomi", TASCOMI_SKIPPING);
  }
};

const multiSaveRegistrationsToTempStore = async configDb => async registration => {
  let fsaId = registration["fsa-rn"];

  //GET LOCAL COUNCIL
  let localCouncil = await getCouncilFromConfigDb(configDb, registration);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${fsaId}`;
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

const getCouncilFromConfigDb = async (client, registration) => {
  //this is a strange nasty hack to extract the council id of the initial registration for older records
  const lcConfigCollection = await LocalCouncilConfigDbCollection(client);
  let councilId;
  if (registration.sourceCouncilId) {
    // POST feature RS-79
    councilId = registration.sourceCouncilId;
  } else {
    // PRE feature RS-79
    councilId = registration.hygieneAndStandards
      ? registration.hygieneAndStandards.code
      : registration.hygiene.code;
  }

  //can return null
  return await findCouncilById(lcConfigCollection, councilId);
};

module.exports = {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction
};
