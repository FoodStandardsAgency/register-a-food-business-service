const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const {
  establishConnectionToCosmos
} = require("../../connectors/cosmos.client");

let allLcConfigData;

const getConfigVersion = async (regDataVersion) => {
  logEmitter.emit("functionCall", "configDb.connector", "getConfigVersion");

  try {
    const configVersionCollection = await establishConnectionToCosmos(
      "config",
      "version"
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
  logEmitter.emit(
    "functionCall",
    "configDb.connector",
    "getAllLocalCouncilConfig"
  );

  try {
    const lcConfigCollection = await establishConnectionToCosmos(
      "config",
      "localAuthorities"
    );
    const allLcConfigDataCursor = await lcConfigCollection.find({});
    allLcConfigData = allLcConfigDataCursor.toArray();

    statusEmitter.emit("incrementCount", "getConfigFromDbSucceeded");
    statusEmitter.emit("setStatus", "mostRecentGetConfigFromDbSucceeded", true);
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

  logEmitter.emit(
    "functionSuccess",
    "configDb.connector",
    "getAllLocalCouncilConfig"
  );

  return allLcConfigData;
};

const getCouncilsForSupplier = async (url) => {
  logEmitter.emit(
    "functionCall",
    "configDb.connector",
    "getCouncilsForSupplier"
  );

  let councils = [];

  try {
    const supplierConfigCollection = await establishConnectionToCosmos(
      "config",
      "suppliers"
    );
    const supplierConfig = await supplierConfigCollection.findOne({
      supplier_url: url
    });
    councils = supplierConfig ? supplierConfig.local_council_urls : [];
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "configDb.connector",
      "getCouncilsForSupplier",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }

  logEmitter.emit(
    "functionSuccess",
    "configDb.connector",
    "getCouncilsForSupplier"
  );

  return councils;
};

module.exports = {
  getAllLocalCouncilConfig,
  getConfigVersion,
  findCouncilByUrl,
  findCouncilById,
  getCouncilsForSupplier
};
