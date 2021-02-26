require("dotenv").config();
const mongodb = require("mongodb");
const { logEmitter } = require("../src/services/logging.service");
const { Registration, connectToDb, closeConnection } = require("../src/db/db");
const {
  establishConnectionToCosmos
} = require("../src/connectors/cosmos.client");

const removeExistingRegistrations = async () => {
  let registrations = null;
  logEmitter.emit(
    "functionCall",
    "remove-existing-from-back-end-cache",
    "removeExistingRegistrations"
  );

  try {
    cachedRegistrations = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );

    registrations = await cachedRegistrations
      .find({ "status.registration.complete": { $ne: true } })
      .toArray();

    if (registrations !== null) {
      console.log("number 1");
      await connectToDb();

      registrations.forEach(async (record) => {
        console.log("number 2");
        let result = await db.Registration.count({
          where: { fsa_rn: record["fsa-rn"] }
        });
        if (result > 0) {
          console.log("number 3");
          await cachedRegistrations.remove({ "fsa-rn": record["fsa-rn"] });
        }
      });
    }
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "remove-existing-from-back-end-cache",
      "getLocalCouncils",
      err
    );

    await closeConnection();
  }

  logEmitter.emit(
    "functionSuccess",
    "remove-existing-from-back-end-cache",
    "getLocalCouncils"
  );
};

removeExistingRegistrations();
