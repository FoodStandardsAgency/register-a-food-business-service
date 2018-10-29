const mongodb = require("mongodb");
const { lcConfigCollectionDouble } = require("./configDb.double");
const { CONFIGDB_URL } = require("../../config");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

let client = undefined;
let configDB = undefined;

let allLcConfigData = [];

const establishConnectionToMongo = async collectionName => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "configDb.connector",
      "getAllLocalCouncilConfig"
    );
    return lcConfigCollectionDouble;
  } else {
    if (configDB === undefined) {
      client = await mongodb.MongoClient.connect(CONFIGDB_URL, {
        useNewUrlParser: true
      });
      configDB = client.db("register_a_food_business_config");
    }
    return configDB.collection(collectionName);
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
      const lcConfigCollection = await establishConnectionToMongo("lcConfig");
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

const clearMongoConnection = () => {
  client = undefined;
  configDB = undefined;
};

const addDeletedId = async id => {
  const deletedIdsCollection = await establishConnectionToMongo("deletedIds");

  return deletedIdsCollection.insertOne({ id: id });
};

module.exports = {
  getAllLocalCouncilConfig,
  clearLcConfigCache,
  clearMongoConnection,
  addDeletedId
};
