const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const {
  getRegistrationByFsaRn
} = require("../src/connectors/registrationDb/registrationDb");
const { connectToDb, closeConnection } = require("../src/db/db");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let recordsToUpdate = [];

const updateFieldsInCosmos = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    //Find records that need updating in cosmos
    recordsToUpdate = await findRecordsToUpdate();
    //Log registration numbers of records needing to be updated
    const fsaRns = recordsToUpdate.map((reg) => {
      return reg["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `Updating fields of ${fsaRns.length} records in Cosmos - ${fsaRns}`
    );
    //Update records in cosmos from fields in PG
    await connectToDb();
    while (recordsToUpdate.length > 0) {
      const promises = recordsToUpdate.slice(0, 50).map(async (reg) => {
        recordsToUpdate = recordsToUpdate.filter((rec) => {
          return rec !== reg;
        });
        await updateFields(reg);
      });
      await Promise.allSettled(promises);
    }
    // Log any registration numbers that failed to update.
    const remainingRecordsToUpdate = await findRecordsToUpdate();
    const remainingFsaRns = remainingRecordsToUpdate.map((reg) => {
      return reg["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      ` ${remainingFsaRns.length} records still needing to be updated: ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `updateFieldsInCosmos failed - ${err}`);
  }
};

const findRecordsToUpdate = async () => {
  try {
    const recordsToUpdate = await beCache
      .find({ collected: { $exists: false } })
      .toArray();

    return recordsToUpdate;
  } catch (err) {
    logEmitter.emit("info", `findsRecordsToUpdate (fields) failed - ${err}`);
  }
};

const updateFields = async (rec) => {
  // Grab fields for each record from their corresponding registration in PG
  const registration = await getRegistrationByFsaRn(rec["fsa-rn"]);
  if (!registration) {
    logEmitter.emit("info", `No registration found in PG for ${rec["fsa-rn"]}`);
    return;
  }
  const {
    collected,
    collected_at,
    direct_submission
  } = registration.dataValues;

  try {
    const response = await beCache.updateOne(
      { "fsa-rn": rec["fsa-rn"] },
      {
        $set: {
          collected: collected,
          collected_at: collected_at,
          directLcSubmission: direct_submission
        },
        $unset: {
          "status.registration": ""
        }
      }
    );
    logEmitter.emit(
      "info",
      `Update record fields response - ${JSON.stringify(response.result)}`
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to update record: ${rec["fsa-rn"]} ${err.message}`
    );
  }
};

updateFieldsInCosmos()
  .then(() => {
    closeCosmosConnection();
    closeConnection();
    logEmitter.emit(
      "info",
      "Successfully finished update cosmos fields script"
    );
  })
  .catch((err) => {
    closeCosmosConnection();
    closeConnection();
    logEmitter.emit(
      "info",
      `Failed to run update cosmos fields script - ${err}`
    );
  });
