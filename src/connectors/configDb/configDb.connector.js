const mongodb = require("mongodb");
const { lcConfigCollectionDouble } = require("./configDb.double");
const { MONGO_CONFIGDB_CONNECTION_STRING } = require("../../config");
const { logEmitter } = require("../../services/logging.service");

let client;
let configDB;
let lcConfigCollection;

const establishConnectionToMongo = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "configDb.connector",
      "getAllLocalCouncilConfig"
    );
    lcConfigCollection = lcConfigCollectionDouble;
  } else {
    client = await mongodb.MongoClient.connect(
      MONGO_CONFIGDB_CONNECTION_STRING,
      {
        useNewUrlParser: true
      }
    );

    configDB = client.db("register_a_food_business_config");

    lcConfigCollection = configDB.collection("lcConfig");
  }
};

const getAllLocalCouncilConfig = async () => {
  logEmitter.emit("functionCall", "configDb.connector", "sendSingleEmail");

  try {
    await establishConnectionToMongo();

    const allLcConfigDataCursor = await lcConfigCollection.find({});
    const allLcConfigData = allLcConfigDataCursor.toArray();

    logEmitter.emit(
      "functionSuccess",
      "configDb.connector",
      "getAllLocalCouncilConfig"
    );
    return allLcConfigData;
  } catch (err) {
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
};

module.exports = { getAllLocalCouncilConfig };
