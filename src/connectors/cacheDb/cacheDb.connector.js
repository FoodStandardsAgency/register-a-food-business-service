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

const updateCompletedInCache = async (fsa_rn, property, value) => {
  logEmitter.emit("functionCall", "cacheDb.connector", "updateCache");
  try {
    const cachedRegistrations = await establishConnectionToMongo();
    let cachedRegistration = await cachedRegistrations.findOne({
      "fsa-rn": fsa_rn
    });

    let newCompleted = cachedRegistration.completed;
    newCompleted[property] = {
      time: new Date().toLocaleString("en-GB", {
        hour12: false,
        timeZone: "Europe/London"
      }),
      result: value
    };

    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { completed: newCompleted }
      }
    );
    statusEmitter.emit("incrementCount", "updateRegistrationsInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateRegistrationInCacheSucceeded",
      true
    );
    logEmitter.emit("functionSuccess", "cacheDb.connector", "updateCache");
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateRegistrationsInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateRegistrationInCacheSucceeded",
      false
    );
    logEmitter.emit("functionFail", "cacheDb.connector", "updateCache", err);

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
  updateCompletedInCache
};
