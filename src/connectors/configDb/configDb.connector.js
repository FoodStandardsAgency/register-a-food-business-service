const { logEmitter } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../../connectors/cosmos.client");
const CONFIG_DATA_LOOKUP_FAILURE = "Configuration data lookup failure";
const CONFIG_DATA_LOOKUP_SUCCESS = "Configuration data lookup success";

let allLcConfigData;

const findCouncilById = async (collection, id) => {
  return await collection.findOne({
    _id: id
  });
};

const findCouncilByUrl = async (collection, url) => {
  return await collection.findOne({
    local_council_url: url
  });
};

const getAllLocalCouncilConfig = async () => {
  logEmitter.emit("functionCall", "configDb.connector", "getAllLocalCouncilConfig");

  try {
    const lcConfigCollection = await establishConnectionToCosmos("config", "localAuthorities");
    const allLcConfigDataCursor = await lcConfigCollection.find({});
    allLcConfigData = allLcConfigDataCursor.toArray();
  } catch (err) {
    logEmitter.emit("warning", CONFIG_DATA_LOOKUP_FAILURE); // Used for Azure alerts
    logEmitter.emit("functionFail", "configDb.connector", "getAllLocalCouncilConfig", err);

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }

  logEmitter.emit("info", CONFIG_DATA_LOOKUP_SUCCESS); // Used for Azure alerts
  logEmitter.emit("functionSuccess", "configDb.connector", "getAllLocalCouncilConfig");

  return allLcConfigData;
};

const getCouncilsForSupplier = async (url) => {
  logEmitter.emit("functionCall", "configDb.connector", "getCouncilsForSupplier");

  let councils = [];

  try {
    const supplierConfigCollection = await establishConnectionToCosmos("config", "suppliers");
    const supplierConfig = await supplierConfigCollection.findOne({
      supplier_url: url
    });
    councils = supplierConfig ? supplierConfig.local_council_urls : [];
  } catch (err) {
    logEmitter.emit("warning", CONFIG_DATA_LOOKUP_FAILURE); // Used for Azure alerts
    logEmitter.emit("functionFail", "configDb.connector", "getCouncilsForSupplier", err);

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }

  logEmitter.emit("info", CONFIG_DATA_LOOKUP_SUCCESS); // Used for Azure alerts
  logEmitter.emit("functionSuccess", "configDb.connector", "getCouncilsForSupplier");

  return councils;
};

module.exports = {
  getAllLocalCouncilConfig,
  findCouncilByUrl,
  findCouncilById,
  getCouncilsForSupplier
};
