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
    logEmitter.emit(
      "info",
      `${metadataRecords.length} records containing metadata`
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
    logEmitter.emit(
      "info",
      `${directLcSubmissionRecords.length} records containing directLcSubmission`
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

const renameAddressFields = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    addressRecords = await findRecords({
      $or: [
        { "establishment.premise.establishment_first_line": { $exists: true } },
        { "establishment.operator.operator_first_line": { $exists: true } }
      ]
    });
    logEmitter.emit(
      "info",
      `${addressRecords.length} records containing old address fields`
    );

    while (addressRecords.length > 0) {
      const promises = addressRecords.slice(0, 50).map(async (rec) => {
        addressRecords = addressRecords.filter((reg) => {
          return reg !== rec;
        });
        await beCache.updateOne(
          { "fsa-rn": rec["fsa-rn"] },
          {
            $rename: {
              "establishment.operator.operator_first_line":
                "operator_address_line_1",
              "establishment.operator.operator_street":
                "operator_address_line_2",
              "establishment.operator.operator_dependent_locality":
                "operator_address_line_3",
              "establishment.premise.establishment_first_line":
                "establishment_address_line_1",
              "establishment.premise.establishment_street":
                "establishment_address_line_2",
              "establishment.premise.establishment_dependent_locality":
                "establishment_address_line_3"
            }
          }
        );
      });
      await Promise.allSettled(promises);
    }

    const remainingAddressRecords = await findRecords({
      $or: [
        { "establishment.premise.establishment_first_line": { $exists: true } },
        { "establishment.operator.operator_first_line": { $exists: true } }
      ]
    });
    const remainingFsaRns = getFsaRns(remainingAddressRecords);
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still containing old address fields - ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to rename records with old address fields: ${err}`
    );
  }
};

renameToDeclaration()
  .then(() => {
    renameDirectSubmission().then(() => {
      renameAddressFields().then(() => {
        closeCosmosConnection();
        logEmitter.emit("info", "Successfully finished rename script");
      });
    });
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit("info", `Failed to run rename script - ${err}`);
  });
