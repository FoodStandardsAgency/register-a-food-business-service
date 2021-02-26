const {
  establishConnectionToCosmos,
  clearCosmosConnection
} = require("../src/connectors/cosmos.client");
const {
  getRegistrationByFsaRn
} = require("../src/connectors/registrationDb/registrationDb");
const { connectToDb, closeConnection } = require("../src/db/db");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let recordsUpdated = [];
let recordsFailedToUpdate = [];

const updateFieldsInCosmos = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  const records = await beCache
    .find({ collected: { $exists: false } })
    .toArray();
  logEmitter.emit(
    "info",
    `Updating fields of ${records.length} records in Cosmos`
  );

  await connectToDb();

  const promises = records.map(async (rec) => {
    await updateFields(rec);
  });
  await Promise.allSettled(promises);
  logEmitter.emit(
    "info",
    `Successfully updated fields of ${recordsUpdated.length} records in cosmos: ${recordsUpdated}`
  );
  logEmitter.emit(
    "info",
    `Failed to update fields of ${recordsFailedToUpdate.length} records in cosmos: ${recordsFailedToUpdate}`
  );
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
    createdAt,
    updatedAt,
    direct_submission
  } = registration.dataValues;

  logEmitter.emit("info", `Updating BE Cache FSA-RN: ${rec["fsa-rn"]}`);
  try {
    await beCache.updateOne(
      { "fsa-rn": rec["fsa-rn"] },
      {
        $set: {
          collected: collected,
          collected_at: collected_at,
          createdAt: createdAt,
          updatedAt: updatedAt,
          direct_submission: direct_submission
        },
        $unset: {
          "status.registration": ""
        }
      }
    );
    recordsUpdated.push(rec["fsa-rn"]);
  } catch (err) {
    recordsFailedToUpdate.push(rec["fsa-rn"]);
    logEmitter.emit(
      "info",
      `Failed to update BE Cache FSA-RN: ${rec["fsa-rn"]} ${err.message}`
    );
  }
};

updateFieldsInCosmos()
  .then(() => {
    clearCosmosConnection();
    closeConnection();
    logEmitter.emit(
      "info",
      "Successfully finished update cosmos fields script"
    );
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run update cosmos fields script");
  });
