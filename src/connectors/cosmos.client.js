const mongodb = require("mongodb");
const { COSMOSDB_URL } = require("../config");
const { logEmitter } = require("../services/logging.service");

let client = undefined;
let DB;

const establishConnectionToCosmos = async (dbName, collectionName) => {
  logEmitter.emit(
    "functionCall",
    "cosmos.client.js",
    "establishConnectionToCosmos"
  );

  // If no connection or connection is not valid after downtime
  if (!client || !client.topology || !client.topology.isConnected()) {
    try {
      if (client && client.topology !== undefined) {
        client.close();
      }
      client = await mongodb.MongoClient.connect(COSMOSDB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "cosmos.client.js",
        "establishConnectionToCosmos",
        err
      );
      throw err;
    }
  }
  DB = client.db(dbName);
  let collection = DB.collection(collectionName);
  logEmitter.emit(
    "functionSuccess",
    "cosmos.client.js",
    "establishConnectionToCosmos"
  );
  return collection;
};

const clearCosmosConnection = () => {
  client = undefined;
  DB = undefined;
};

const closeCosmosConnection = () => {
  client && client.close();
  client = undefined;
  DB = undefined;
};

module.exports = {
  establishConnectionToCosmos,
  clearCosmosConnection,
  closeCosmosConnection
};
