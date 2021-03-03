const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;

const renameToDeclaration = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");
  try {
    let response = await beCache.updateMany(
      { metadata: { $exists: true } },
      { $rename: { metadata: "declaration" } }
    );
    logEmitter.emit(
      "info",
      `Renamed metadata of ${response.result.nModified} records`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to rename records metadata: ${err.message}`
    );
  }
};

renameToDeclaration()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Successfully finished rename metadata script");
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run rename metadata script");
  });
