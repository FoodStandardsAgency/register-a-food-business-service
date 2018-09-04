const mongodb = require("mongodb");
const { CACHEDB_URL } = require("../../config");
const { cachedRegistrationsDouble } = require("./cacheDb.double");
const { logEmitter } = require("../../services/logging.service");

let client;
let cacheDB;
let cachedRegistrations;

const establishConnectionToMongo = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "cacheDb.connector",
      "getAllLocalCouncilConfig"
    );
    cachedRegistrations = cachedRegistrationsDouble;
  } else {
    client = await mongodb.MongoClient.connect(CACHEDB_URL, {
      useNewUrlParser: true
    });

    cacheDB = client.db("register_a_food_business_cache");

    cachedRegistrations = cacheDB.collection("cachedRegistrations");
  }
};

const cacheRegistration = async registration => {
  logEmitter.emit("functionCall", "cacheDb.connector", "cacheRegistration");
  try {
    await establishConnectionToMongo();
    const response = await cachedRegistrations.insertOne(registration);

    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "cacheRegistration"
    );

    return response;
  } catch (err) {
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

module.exports = { cacheRegistration };
