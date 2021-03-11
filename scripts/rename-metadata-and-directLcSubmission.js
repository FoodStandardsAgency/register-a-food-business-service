const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let metadataRecords = [];
let directLcSubmissionRecords = [];

const findRecords = async (query) => {
  try {
    const records = await beCache.find(query).toArray();

    return records;
  } catch (err) {
    logEmitter.emit("info", `findRecords(${query}) failed - ${err}`);
  }
};

const getFsaRns = (records) => {
  const fsaRns = records.map((rec) => {
    return rec["fsa-rn"];
  });
  return fsaRns;
};

const renameToDeclaration = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    metadataRecords = await findRecords({ metadata: { $exists: true } });
    const metadataFsaRns = getFsaRns(metadataRecords);
    logEmitter.emit(
      "info",
      `${metadataFsaRns.length} records containing metadata - ${metadataFsaRns}`
    );

    while (metadataRecords.length > 0) {
      const promises = metadataRecords.slice(0, 50).map(async (rec) => {
        metadataRecords = metadataRecords.filter((reg) => {
          return reg !== rec;
        });
        await beCache.updateOne(
          { "fsa-rn": rec["fsa-rn"] },
          { $rename: { metadata: "declaration" } }
        );
      });
      await Promise.allSettled(promises);
    }

    const remainingMetadataRecords = await findRecords({
      metadata: { $exists: true }
    });
    const remainingFsaRns = getFsaRns(remainingMetadataRecords);
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still containing metadata - ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `Failed to rename records metadata: ${err}`);
  }
};

const renameDirectSubmission = async () => {
  // $rename will unset both the new and old names and then set the new one again.
  // So any documents containg direct_submission and directLcSubmission will be corrected.
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    directLcSubmissionRecords = await findRecords({
      directLcSubmission: { $exists: true }
    });
    const directLcSubmissionFsaRns = getFsaRns(directLcSubmissionRecords);
    logEmitter.emit(
      "info",
      `${directLcSubmissionFsaRns.length} records containing directLcSubmission - ${directLcSubmissionFsaRns}`
    );

    while (directLcSubmissionRecords.length > 0) {
      const promises = directLcSubmissionRecords
        .slice(0, 50)
        .map(async (rec) => {
          directLcSubmissionRecords = directLcSubmissionRecords.filter(
            (reg) => {
              return reg !== rec;
            }
          );
          await beCache.updateOne(
            { "fsa-rn": rec["fsa-rn"] },
            { $rename: { directLcSubmission: "direct_submission" } }
          );
        });
      await Promise.allSettled(promises);
    }

    const remainingDirectLcSubmissionRecords = await findRecords({
      directLcSubmission: { $exists: true }
    });
    const remainingFsaRns = getFsaRns(remainingDirectLcSubmissionRecords);
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still containing directLcSubmission - ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to rename records directLcSubmission: ${err}`
    );
  }
};

renameToDeclaration()
  .then(() => {
    renameDirectSubmission().then(() => {
      closeCosmosConnection();
      logEmitter.emit("info", "Successfully finished rename script");
    });
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit("info", `Failed to run rename script - ${err}`);
  });
