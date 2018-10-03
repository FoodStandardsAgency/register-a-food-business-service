const mongodb = require("mongodb");
const { lcConfigCollectionDouble } = require("./configDb.double");
const { CONFIGDB_URL } = require("../../config");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

let client;
let configDB;
let lcConfigCollection, deletedIdsCollection;

let allLcConfigData = [];

const establishConnectionToMongo = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "configDb.connector",
      "getAllLocalCouncilConfig"
    );
    lcConfigCollection = lcConfigCollectionDouble;
  } else {
    client = await mongodb.MongoClient.connect(CONFIGDB_URL, {
      useNewUrlParser: true
    });

    configDB = client.db("register_a_food_business_config");

    lcConfigCollection = configDB.collection("lcConfig");
    deletedIdsCollection = configDB.collection("deletedIds");
  }
};

const getAllLocalCouncilConfig = async () => {
  logEmitter.emit(
    "functionCall",
    "configDb.connector",
    "getAllLocalCouncilConfig"
  );

  if (allLcConfigData.length === 0) {
    try {
      await establishConnectionToMongo();

      const allLcConfigDataCursor = await lcConfigCollection.find({});
      allLcConfigData = allLcConfigDataCursor.toArray();

      statusEmitter.emit("incrementCount", "getConfigFromDbSucceeded");
      statusEmitter.emit(
        "setStatus",
        "mostRecentGetConfigFromDbSucceeded",
        true
      );
    } catch (err) {
      statusEmitter.emit("incrementCount", "getConfigFromDbFailed");
      statusEmitter.emit(
        "setStatus",
        "mostRecentGetConfigFromDbSucceeded",
        false
      );
      logEmitter.emit(
        "functionFail",
        "configDb.connector",
        "getAllLocalCouncilConfig",
        err
      );

      const newError = new Error();
      newError.name = "mongoConnectionError";
      newError.message = err.message;

      throw newError;
    }
  }

  logEmitter.emit(
    "functionSuccess",
    "configDb.connector",
    "getAllLocalCouncilConfig"
  );

  return allLcConfigData;
};

const clearLcConfigCache = () => {
  allLcConfigData = [];
  return allLcConfigData;
};

const addDeletedId = async id => {
  await establishConnectionToMongo();

  return deletedIdsCollection.insertOne({ id: id });
};

module.exports = { getAllLocalCouncilConfig, clearLcConfigCache, addDeletedId };
