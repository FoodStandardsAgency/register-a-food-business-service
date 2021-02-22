const {
  establishConnectionToMongo
} = require("../src/connectors/cacheDb/cacheDb.connector");
const connectToDb = require("../src/db/db");
const getRegistrationByFsaRn = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");

let successfulDeletions = [];
let faieldDeletions = [];

const deleteTestRegistrationsFromCosmos = async () => {
  const beCache = await establishConnectionToMongo();

  const records = await beCache.find({}).toArray();

  await connectToDb();

  // Find records that aren't in PG (test records) and remove them from Cosmos.
  const promises = records.map(async (rec) => {
    const registration = await getRegistrationByFsaRn(rec["fsa-rn"]);
    if (!registration) {
      await removeCosmosRecord(rec).then(() => {
        logEmitter.emit(
          "info",
          `Successfully removed BE Cache FSA-RN: ${rec["fsa-rn"]}`
        );
        successfulDeletions.push(rec["fsa-rn"]);
      });
    }
  });
  await Promise.allSettled(promises);
  logEmitter.emit(
    "info",
    `Successfully deleted registrations from Cosmos: ${successfulDeletions}`
  );
  logEmitter.emit(
    "info",
    `Failed to delete following registrations from Cosmos: ${faieldDeletions}`
  );
};

const removeCosmosRecord = async (record) => {
  logEmitter.emit("info", `Removing BE Cache FSA-RN: ${record["fsa-rn"]}`);
  try {
    await beCache.remove({ "fsa-rn": record["fsa-rn"] });
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to remove BE Cache FSA-RN: ${record["fsa-rn"]} ${err.message}`
    );
    faieldDeletions.push(record["fsa-rn"]);
  }
};

module.exports = { deleteTestRegistrationsFromCosmos };
