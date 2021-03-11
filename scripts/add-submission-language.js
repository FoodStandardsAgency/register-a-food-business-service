const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

// Set all records missing language submission to "en", for those submitted after the data
// is copied to the new cosmos db with "cy" as their submission language we will have to manually reset.
// They will be missing the language because they won't have been copied across from the old back-end-cache
// and when they are inserted from PG they will be missing the language as that isn't stored in PG.

let beCache;
let missingLanguageRecords = [];

const addSubmissionLanguage = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    missingLanguageRecords = await findRecords({
      submission_language: { $exists: false }
    });
    logEmitter.emit(
      "info",
      `${missingLanguageRecords.length} records missing submission language`
    );

    while (missingLanguageRecords.length > 0) {
      const promises = missingLanguageRecords.slice(0, 50).map(async (rec) => {
        missingLanguageRecords = missingLanguageRecords.filter((reg) => {
          return reg !== rec;
        });
        await beCache.updateOne(
          { "fsa-rn": rec["fsa-rn"] },
          { $set: { submission_language: "en" } }
        );
      });
      await Promise.allSettled(promises);
    }

    const remainingRecordsMissingLanguage = await findRecords({
      submission_language: { $exists: false }
    });
    const remainingFsaRns = getFsaRns(remainingRecordsMissingLanguage);
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still missing submission language - ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to insert missing submisison language fields: ${err}`
    );
  }
};

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

addSubmissionLanguage()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit(
      "info",
      "Successfully finished add submission_language script"
    );
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit(
      "info",
      `Failed to run add submission_language script -${err}`
    );
  });
