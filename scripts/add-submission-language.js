const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;

const addSubmissionLanguage = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");
  try {
    let response = await beCache.updateMany(
      { submission_language: { $exists: false } },
      { $set: { submission_language: "en" } }
    );
    logEmitter.emit(
      "info",
      `Added submission_language to ${response.result.nModified} records`
    );
    const recordsMissingLanguage = await beCache
      .find({ submission_language: { $exists: false } })
      .toArray();
    const fsaRnsMissingLanguage = recordsMissingLanguage.map((rec) => {
      return rec["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `${fsaRnsMissingLanguage.length} records still missing language field - ${fsaRnsMissingLanguage}`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to add submission_language: ${err.message}`
    );
  }
};

addSubmissionLanguage()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit(
      "info",
      "Successfully finished add submission_language script"
    );
  })
  .catch(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Failed to run add submission_language script");
  });
