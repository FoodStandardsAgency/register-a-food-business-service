const {
  establishConnectionToCosmos,
  clearCosmosConnection
} = require("../src/connectors/cosmos.client");
const { connectToDb, closeConnection } = require("../src/db/db");
const {
  getRegistrationByFsaRn
} = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");

let successfulDeletions = [];
let failedDeletions = [];
let beCache;

const deleteTestRegistrationsFromCosmos = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  const records = await beCache.find({}).toArray();

  await connectToDb();

  // Find records that aren't in PG (test records) and remove them from Cosmos.
  const promises = records.map(async (rec) => {
    const registration = await getRegistrationByFsaRn(rec["fsa-rn"]);
    if (!registration) {
      await removeCosmosRecord(rec);
    }
  });
  await Promise.all(promises);
  logEmitter.emit(
    "info",
    `Successfully deleted ${successfulDeletions.length} registrations from Cosmos: ${successfulDeletions}`
  );
  logEmitter.emit(
    "info",
    `Failed to delete ${failedDeletions.length} registrations from Cosmos: ${failedDeletions}`
  );
  return;
};

const removeCosmosRecord = async (record) => {
  logEmitter.emit("info", `Removing BE Cache FSA-RN: ${record["fsa-rn"]}`);
  try {
    await beCache.deleteOne({ "fsa-rn": record["fsa-rn"] });
    successfulDeletions.push(record["fsa-rn"]);
    return;
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to remove BE Cache FSA-RN: ${record["fsa-rn"]} ${err.message}`
    );
    failedDeletions.push(record["fsa-rn"]);
  }
};

deleteTestRegistrationsFromCosmos()
  .then(() => {
    clearCosmosConnection();
    closeConnection();
    logEmitter.emit(
      "info",
      "Successfully finished remove test registrations script"
    );
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run remove test registrations script");
  });
