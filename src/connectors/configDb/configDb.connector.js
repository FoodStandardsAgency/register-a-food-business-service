const mongodb = require("mongodb");
const { lcConfigCollectionDouble } = require("./configDb.double");
const { CONFIGDB_URL } = require("../../config");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const {
  getCouncilByUrl,
  getCouncilById,
  getAllCouncils
} = require("../registrationDb/registrationDb");

let client = undefined;
let configDB = undefined;

const establishConnectionToMongo = async (collectionName) => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "configDb.connector",
      "establishConnectionToMongo"
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

const connectToConfigDb = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "configDb.connector",
      "establishConnectionToMongo"
    );
    return lcConfigCollectionDouble;
  } else {
    if (configDB === undefined) {
      client = await mongodb.MongoClient.connect(CONFIGDB_URL, {
        useNewUrlParser: true
      });
      configDB = client.db("register_a_food_business_config");
    }
    return configDB;
  }
};

const disconnectConfigDb = async () => {
  if (client) {
    client.close();
  }
};

const ConfigVersionCollection = async (database) =>
  await database.collection("configVersion");
const LocalCouncilConfigDbCollection = async (database) =>
  await database.collection("lcConfig");

const getConfigVersion = async (regDataVersion) => {
  logEmitter.emit("functionCall", "configDb.connector", "getConfigVersion");

  try {
    const configVersionCollection = await establishConnectionToMongo(
      "configVersion"
    );
    const configVersionData = await configVersionCollection.findOne({
      _id: regDataVersion
    });
    statusEmitter.emit("incrementCount", "getConfigFromDbSucceeded");
    statusEmitter.emit("setStatus", "mostRecentGetConfigFromDbSucceeded", true);
    logEmitter.emit(
      "functionSuccess",
      "configDB.connector",
      "getConfigVersion"
    );
    return configVersionData;
  } catch (err) {
    statusEmitter.emit("incrementCount", "getConfigFromDbFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentGetConfigFromDbSucceeded",
      false
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    logEmitter.emit(
      "functionFail",
      "configDb.connector",
      "getConfigVersion",
      newError
    );

    throw newError;
  }
};

const findCouncilById = async (collection, id) => {
  return getCouncilById(id);
};

const findCouncilByUrl = async (collection, url) => {
  return await getCouncilByUrl(url);
};

const getAllLocalCouncilConfig = async () => {
  return await getAllCouncils();
};

const clearMongoConnection = () => {
  client = undefined;
  configDB = undefined;
};

const addDeletedId = async (id) => {
  const deletedIdsCollection = await establishConnectionToMongo("deletedIds");

  return deletedIdsCollection.insertOne({ id: id });
};

module.exports = {
  mongodb,
  establishConnectionToMongo,
  connectToConfigDb,
  disconnectConfigDb,
  LocalCouncilConfigDbCollection,
  ConfigVersionCollection,
  getAllLocalCouncilConfig,
  clearMongoConnection,
  addDeletedId,
  getConfigVersion,
  findCouncilByUrl,
  findCouncilById
};
