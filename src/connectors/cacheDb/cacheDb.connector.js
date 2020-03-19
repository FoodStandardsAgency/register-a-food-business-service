const mongodb = require("mongodb");
const { CACHEDB_URL } = require("../../config");
const { cachedRegistrationsDouble } = require("./cacheDb.double");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

let client = undefined;
let cacheDB = undefined;

const establishConnectionToMongo = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "cacheDb.connector",
      "getAllLocalCouncilConfig"
    );
    return cachedRegistrationsDouble;
  } else {
    if (cacheDB === undefined) {
      client = await mongodb.MongoClient.connect(CACHEDB_URL, {
        useNewUrlParser: true
      });
      cacheDB = client.db("register_a_food_business_cache");
    }

    return cacheDB.collection("cachedRegistrations");
  }
};

const connectToBeCacheDb = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "cacheDb.connector",
      "getAllLocalCouncilConfig"
    );
    return cachedRegistrationsDouble;
  } else {
    if (client === undefined) {
      client = await mongodb.MongoClient.connect(CACHEDB_URL, {
        useNewUrlParser: true
      });
    }

    return await client.db("register_a_food_business_cache");
  }
};

const disconnectCacheDb = async () => {
  if (client) {
    client.close();
  }
};

const CachedRegistrationsCollection = async client =>
  await client.collection("cachedRegistrations");

const getDate = () => {
  return new Date().toLocaleString("en-GB", {
    hour12: false,
    timeZone: "Europe/London"
  });
};

const cacheRegistration = async registration => {
  logEmitter.emit("functionCall", "cacheDb.connector", "cacheRegistration");
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    const response = await cachedRegistrations.insertOne(registration);

    statusEmitter.emit("incrementCount", "storeRegistrationsInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentRegistrationInCacheSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "cacheRegistration"
    );

    return response;
  } catch (err) {
    statusEmitter.emit("incrementCount", "storeRegistrationsInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentRegistrationInCacheSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "cacheRegistration",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Update the completed objects for the Registration and Tascomi objects
 * @param {string} fsa_rn The FSA-RN for the registration to be updated
 * @param {string} property The specific field to be updated
 * @param {boolean} value The value for the result
 */
const updateStatusInCache = async (fsa_rn, property, value) => {
  logEmitter.emit("functionCall", "cacheDb.connector", "updateStatusInCache");
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    const status = await getStatus(cachedRegistrations, fsa_rn);

    status[property] = {
      time: getDate(),
      complete: value
    };

    await updateStatus(cachedRegistrations, fsa_rn, status);

    statusEmitter.emit("incrementCount", "updateStatusInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateStatusInCacheSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "updateStatusInCache"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateStatusInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateStatusInCacheSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "updateStatusInCache",
      err
    );
  }
};

const findAllOutstandingNotificationsRegistrations = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find({
      $or: [
        {
          "status.notifications": {
            $elemMatch: { sent: { $ne: true } }
          }
        },
        { "status.notifications": { $exists: false } }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findOutstandingTascomiRegistrationsFsaIds = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find(
      {
        $or: [
          { "status.tascomi.complete": { $eq: false } },
          { "status.tascomi": { $exists: false } }
        ]
      },
      { _id: 1, "fsa-rn": 1 }
    )
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findOneById = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration);
};

const getStatus = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration.status);
};

const updateStatus = async (cachedRegistrations, fsa_rn, newStatus) => {
  try {
    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { status: newStatus }
      }
    );
    logEmitter.emit("functionSuccess", "cacheDb.connector", "updateStatus");
  } catch (err) {
    logEmitter.emit("functionFail", "cacheDb.connector", "updateStatus", err);
  }
};

/**
 * Updates a specific notification when sent, finding the notification status from the type and address and updating the time and result fields
 * @param {string} fsa_rn The FSA-RN number for the registration to be updated
 * @param {string} notificationType The type of notification to be sent
 * @param {string} notificationAddress The address of the notification to be sent
 */
const updateNotificationOnSent = async (
  fsa_rn,
  notificationType,
  notificationAddress
) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "updateNotificationOnSent"
  );
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    const status = await getStatus(cachedRegistrations, fsa_rn);

    const index = status.notifications.findIndex(
      ({ type, address }) =>
        type === notificationType && address === notificationAddress
    );
    status.notifications[index].time = getDate();
    status.notifications[index].sent = true;

    await updateStatus(cachedRegistrations, fsa_rn, status);

    statusEmitter.emit("incrementCount", "updateNotificationOnSentSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateNotificationOnSentSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "updateNotificationOnSent"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateNotificationOnSentFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateNotificationOnSentSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "updateNotificationOnSent",
      err
    );
  }
};

/**
 * Add an object to the notifications field containing the status for each email to be sent, initialises with false
 * @param {string} fsa_rn The FSA-RN for the registration to have completed notifications for
 * @param {object} emailsToSend An object containing all of the emails to be sent
 */
const addNotificationToStatus = async (fsa_rn, emailsToSend) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "addNotificationToStatus"
  );
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    const status = await getStatus(cachedRegistrations, fsa_rn);

    status.notifications = [];
    for (let index in emailsToSend) {
      status.notifications.push({
        time: undefined,
        sent: false,
        type: emailsToSend[index].type,
        address: emailsToSend[index].address
      });
    }

    await updateStatus(cachedRegistrations, fsa_rn, status);

    statusEmitter.emit("incrementCount", "addNotificationToStatusSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentAddNotificationToStatusSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "addNotificationToStatus"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "addNotificationToStatusFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentAddNotificationToStatusSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "addNotificationToStatus",
      err
    );
  }
};

const clearMongoConnection = () => {
  client = undefined;
  cacheDB = undefined;
};

module.exports = {
  findAllOutstandingNotificationsRegistrations,
  findOutstandingTascomiRegistrationsFsaIds,
  cacheRegistration,
  clearMongoConnection,
  updateStatusInCache,
  addNotificationToStatus,
  updateNotificationOnSent,
  establishConnectionToMongo,
  findOneById,
  CachedRegistrationsCollection,
  connectToBeCacheDb,
  disconnectCacheDb
};
