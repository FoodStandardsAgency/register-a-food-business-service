const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { connectToDb, closeConnection } = require("../src/db/db");
const {
  getAllRegistrationRNs
} = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");
const fetch = require("node-fetch");

let beCache;

let apiUrl = "http://localhost:4000";

apiUrl = process.env.API_URL ? process.env.API_URL : apiUrl;

const triggerSaveToTemp = async () => {
  const res = await fetch(`${apiUrl}/api/tasks/bulk/savetotempstore`);
  return res.json();
};

const deleteTestRegistrationsFromCosmos = async () => {
  try {
    const testRecords = await findTestRegistrations();
    //Delete all test registrations from cosmos
    logEmitter.emit("info", "Deleting test records...");

    while (testRecords > 0) {
      const promises = testRecords.slice(0, 50).map(async (reg) => {
        testRecords = testRecords.filter((rec) => {
          return rec !== reg;
        });
        await beCache.deleteOne({ "fsa-rn": reg["fsa-rn"] });
      });
      await Promise.allSettled(promises);
    }
    const testRecordsRemaining = await findTestRegistrations();
    logEmitter.emit(
      "info",
      `Test records remaining in cosmos: ${testRecordsRemaining.length} - ${testRecordsRemaining}`
    );
  } catch (err) {
    logEmitter.emit("info", `Remove test registrations failed - ${err}`);
  }
};

const findTestRegistrations = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    //Find all FSA-RN from each database.
    const cosmosRecords = await beCache
      .find({}, { projection: { _id: 0, "fsa-rn": 1 } })
      .toArray();
    const cosmosRecordNumbers = cosmosRecords.map((rec) => {
      return rec["fsa-rn"];
    });

    await connectToDb();
    const pgRegistrations = await getAllRegistrationRNs();
    const pgRegistrationNumbers = pgRegistrations.map((reg) => {
      return reg.dataValues["fsa_rn"];
    });

    // Find records that aren't in PG (test records).
    const testRecords = cosmosRecordNumbers.filter((record) => {
      return pgRegistrationNumbers.indexOf(record) < 0;
    });
    logEmitter.emit(
      "info",
      `Test registrations found in cosmos: ${testRecords.length}`
    );
    return testRecords;
  } catch (err) {
    logEmitter.emit("info", `findTestRegistrations failed - ${err}`);
  }
};

triggerSaveToTemp()
  .then(() => {
    deleteTestRegistrationsFromCosmos().then(() => {
      closeCosmosConnection();
      closeConnection();
      logEmitter.emit(
        "info",
        "Successfully finished remove test registrations script"
      );
    });
  })
  .catch((err) => {
    closeCosmosConnection();
    closeConnection();
    logEmitter.emit(
      "info",
      `Failed to run remove test registrations script - ${err}`
    );
  });
