const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;

const renameToDeclaration = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");
  try {
    const response = await beCache.updateMany(
      { metadata: { $exists: true } },
      { $rename: { metadata: "declaration" } }
    );
    logEmitter.emit(
      "info",
      `Renamed metadata of ${response.result.nModified} records`
    );
    const remainingRecordsToUpdate = await beCache
      .find({ metadata: { $exists: true } })
      .toArray();
    const remaingFsaRns = remainingRecordsToUpdate.map((rec) => {
      return rec["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `${remaingFsaRns.length} records reminaing with metadata - ${remaingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `Failed to rename records metadata: ${err}`);
  }
};

const renameDirectSubmission = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");
  try {
    let response = await beCache.updateMany(
      { directLcSubmission: { $exists: true } },
      { $rename: { directLcSubmission: "direct_submission" } }
    );
    logEmitter.emit(
      "info",
      `Renamed direct submission of ${response.result.nModified} records`
    );
    const remainingRecordsToUpdate = await beCache
      .find({ directLcSubmission: { $exists: true } })
      .toArray();
    const remaingFsaRns = remainingRecordsToUpdate.map((rec) => {
      return rec["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `${remaingFsaRns.length} records reminaing with directLcSubmission - ${remaingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `Failed to rename records metadata: ${err}`);
  }
};

renameToDeclaration()
  .then(() => {
    renameDirectSubmission().then(() => {
      closeCosmosConnection();
      logEmitter.emit("info", "Successfully finished rename metadata script");
    });
  })
  .catch((err) => {
    logEmitter.emit("info", `Failed to run rename metadata script - ${err}`);
  });
