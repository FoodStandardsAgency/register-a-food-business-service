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
 * @param {string} value The value for the result
 */
const updateCompletedInCache = async (fsa_rn, property, value) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "updateCompletedInCache"
  );
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    let cachedRegistration = await cachedRegistrations.findOne({
      "fsa-rn": fsa_rn
    });

    let newCompleted = cachedRegistration.completed;
    newCompleted[property] = {
      time: getDate(),
      result: value
    };

    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { completed: newCompleted }
      }
    );
    statusEmitter.emit("incrementCount", "updateCompletedInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateCompletedInCacheSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "updateCompletedInCache"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateCompletedInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateCompletedInCacheSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "updateCompletedInCache",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Updates a specific notification when completed, finding the notification status from the type and address and updating the time and result fields
 * @param {string} fsa_rn The FSA-RN number for the registration to be updated
 * @param {string} notificationType The type of notification to be sent
 * @param {string} notificationAddress The address of the notification to be sent
 * @param {string} value The value to be recorded in the result parameter
 */
const updateNotificationOnCompleted = async (
  fsa_rn,
  notificationType,
  notificationAddress,
  value
) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "updateNotificationOnCompleted"
  );
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    let cachedRegistration = await cachedRegistrations.findOne({
      "fsa-rn": fsa_rn
    });
    let newCompleted = cachedRegistration.completed;
    let index = newCompleted.notifications.findIndex(
      ({ type, address }) =>
        type === notificationType && address === notificationAddress
    );
    newCompleted.notifications[index].time = getDate();
    newCompleted.notifications[index].result = value;

    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { completed: newCompleted }
      }
    );
    statusEmitter.emit(
      "incrementCount",
      "UpdateNotificationOnCompletedSucceeded"
    );
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateNotificationOnCompletedSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "updateNotificationOnCompleted"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateNotificationOnCompletedFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateNotificationOnCompletedSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "updateNotificationOnCompleted",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Add an object to the notifications field containing the status for each email to be sent
 * @param {string} fsa_rn The FSA-RN for the registration to have completed notifications for
 * @param {object} emailsToSend An object containing all of the emails to be sent
 */
const addNotificationToCompleted = async (fsa_rn, emailsToSend) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "addNotificationToCompleted"
  );
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    let cachedRegistration = await cachedRegistrations.findOne({
      "fsa-rn": fsa_rn
    });
    let newCompleted = cachedRegistration.completed;
    newCompleted.notifications = [];
    for (let index in emailsToSend) {
      newCompleted.notifications.push({
        time: undefined,
        result: undefined,
        type: emailsToSend[index].type,
        address: emailsToSend[index].address
      });
    }

    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      { $set: { completed: newCompleted } }
    );

    statusEmitter.emit("incrementCount", "addNotificationToCompletedSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentAddNotificationToCompletedSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "addNotificationToCompleted"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "addNotificationToCompletedFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentAddNotificationToCompletedSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "addNotificationToCompleted",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;
    throw newError;
  }
};

const clearMongoConnection = () => {
  client = undefined;
  cacheDB = undefined;
};

module.exports = {
  cacheRegistration,
  clearMongoConnection,
  updateCompletedInCache,
  addNotificationToCompleted,
  updateNotificationOnCompleted
};
