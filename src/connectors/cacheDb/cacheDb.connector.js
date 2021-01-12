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
        useNewUrlParser: true,
        useUnifiedTopology: true
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

const CachedRegistrationsCollection = async (client) =>
  await client.collection("cachedRegistrations");

const getDate = () => {
  return new Date().toLocaleString("en-GB", {
    hour12: false,
    timeZone: "Europe/London"
  });
};

const cacheRegistration = async (registration) => {
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

const findAllOutstandingSavesToTempStore = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find({ "status.registration.complete": { $ne: true } })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findAllFailedNotificationsRegistrations = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find({
      $and: [
        {
          "status.notifications": {
            $elemMatch: { sent: { $ne: true } }
          }
        },
        {
          $or: [
            { directLcSubmission: { $exists: false } },
            { directLcSubmission: null },
            { directLcSubmission: false }
          ]
        }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findAllBlankRegistrations = async (cachedRegistrations, limit = 100) => {
  return await cachedRegistrations
    .find({
      $and: [
        {
          $or: [
            { "status.notifications": { $exists: false } },
            { "status.notifications": null }
          ]
        },
        {
          $or: [
            { directLcSubmission: { $exists: false } },
            { directLcSubmission: null },
            { directLcSubmission: false }
          ]
        }
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
    .find({
      $and: [
        { "status.tascomi": { $exists: true } },
        { "status.tascomi.complete": { $ne: true } },
        {
          $or: [
            { directLcSubmission: { $exists: false } },
            { directLcSubmission: null },
            { directLcSubmission: false }
          ]
        }
      ]
    })
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
  logEmitter.emit("functionCall", "cacheDb.connector", "updateStatus");
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
 * @param status
 * @param {string} fsa_rn The FSA-RN number for the registration to be updated
 * @param emailsToSend
 * @param index The index of the email - we need this to make sure we update the right item if the same email address has been used multiple times.
 * @param sent
 * @param date
 */
const updateNotificationOnSent = (
  status,
  fsa_rn,
  emailsToSend,
  index,
  sent,
  date = null
) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "updateNotificationOnSent"
  );
  let { type, address } = emailsToSend[index];
  date = date === null ? getDate() : date;
  status.notifications[index].address = address;
  status.notifications[index].type = type;
  status.notifications[index].time = date;
  status.notifications[index].sent = sent;

  logEmitter.emit(
    "functionSuccess",
    "cacheDb.connector",
    "updateNotificationOnSent"
  );

  return status;
};

const clearMongoConnection = () => {
  client = undefined;
  cacheDB = undefined;
};

module.exports = {
  findAllOutstandingSavesToTempStore,
  findAllFailedNotificationsRegistrations,
  findAllBlankRegistrations,
  findOutstandingTascomiRegistrationsFsaIds,
  cacheRegistration,
  clearMongoConnection,
  updateStatusInCache,
  updateNotificationOnSent,
  establishConnectionToMongo,
  findOneById,
  CachedRegistrationsCollection,
  connectToBeCacheDb,
  disconnectCacheDb,
  getStatus,
  updateStatus
};
