/**
 * Updates and stores status variables
 * @module connectors/status
 */
const mongodb = require("mongodb");
const { statusCollectionDouble } = require("./status-db.double");
const { CONFIGDB_URL } = require("../../config");
const { logEmitter } = require("../../services/logging.service");

let client;
let statusDB;
let statusCollection;

/**
 * Sets up a connection to the status collection in the config database.
 * The client, configDB, and statusCollection variables are accessible to other functions in this connector.
 */
const establishConnectionToMongo = async () => {
  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit(
      "doubleMode",
      "status-db.connector",
      "establishConnectionToMongo"
    );
    statusCollection = statusCollectionDouble;
  } else {
    logEmitter.emit(
      "functionCall",
      "status-db.connector",
      "establishConnectionToMongo"
    );

    // If no connection or connection is not valid after downtime
    if (!client || !client.topology || !client.topology.isConnected()) {
      try {
        if (client && client.topology !== undefined) {
          client.close();
        }
        client = await mongodb.MongoClient.connect(CONFIGDB_URL, {
          useNewUrlParser: true
        });
      } catch (err) {
        logEmitter.emit(
          "functionFail",
          "status-db.connector",
          "establishConnectionToMongo",
          err
        );
        throw err;
      }
    } else {
    }

    statusDB = client.db("register_a_food_business_status");
    statusCollection = statusDB.collection("status");

    logEmitter.emit(
      "functionSuccess",
      "status-db.connector",
      "establishConnectionToMongo"
    );
  }
};

/**
 * Fetches all available email values
 * *
 * @returns {object} All email values
 */
const getEmailDistribution = async () => {
  logEmitter.emit(
    "functionCall",
    "status-db.connector",
    "getEmailDistribution"
  );
  try {
    await establishConnectionToMongo();
    let emailList = await statusCollection.findOne({
      _id: "emailDistribution"
    });

    logEmitter.emit(
      "functionSuccess",
      "status-db.connector",
      "getEmailDistribution"
    );

    return emailList.emailAddresses;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "status-db.connector",
      "getEmailDistribution",
      err
    );
    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Fetches all available status values
 * *
 * @returns {object} All status values
 */
const getStoredStatus = async () => {
  logEmitter.emit("functionCall", "status-db.connector", "getStoredStatus");
  try {
    await establishConnectionToMongo();
    const storedStatus = await statusCollection.findOne({
      _id: "backEndStatus"
    });
    logEmitter.emit(
      "functionSuccess",
      "status-db.connector",
      "getStoredStatus"
    );

    return storedStatus;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "status-db.connector",
      "getStoredStatus",
      err
    );
    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Updates a specified status value
 *
 * @param {string} statusName The status field name
 * @param {any} newStatus The new status value
 *
 * @returns {any} The new status value
 */
const updateStoredStatus = async (statusName, newStatus) => {
  logEmitter.emit("functionCall", "status-db.connector", "updateStoredStatus");
  try {
    await establishConnectionToMongo();
    await statusCollection.updateOne(
      { _id: "backEndStatus" },
      { $set: { [statusName]: newStatus } }
    );
    logEmitter.emit(
      "functionSuccess",
      "status-db.connector",
      "updateStoredStatus"
    );
    return newStatus;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "status-db.connector",
      "updateStoredStatus",
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
  statusDB = undefined;
  statusCollection = undefined;
};

module.exports = {
  getStoredStatus,
  clearMongoConnection,
  updateStoredStatus,
  getEmailDistribution
};
