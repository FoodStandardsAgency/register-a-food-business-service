const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let missingEmailRecords = [];

const findRecords = async () => {
  try {
    const records = await beCache
      .find({ "status.notifications.0.address": { $type: 10 } })
      .toArray();

    return records;
  } catch (err) {
    logEmitter.emit("info", `findRecords() failed - ${err}`);
  }
};

const getFsaRns = (records) => {
  const fsaRns = records.map((rec) => {
    return rec["fsa-rn"];
  });
  return fsaRns;
};

const insertLCEmails = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    missingEmailRecords = await findRecords();
    logEmitter.emit(
      "info",
      `${missingEmailRecords.length} records missing LC emails`
    );
    logEmitter.emit("info", "Inserting LC emails in cosmos...");
    while (missingEmailRecords.length > 0) {
      const promises = missingEmailRecords.slice(0, 50).map(async (rec) => {
        missingEmailRecords = missingEmailRecords.filter((reg) => {
          return reg !== rec;
        });
        await beCache.updateOne(
          { "fsa-rn": rec["fsa-rn"] },
          {
            $set: {
              "status.notifications.0.address":
                rec.hygieneAndStandards.local_council_notify_emails[0]
            }
          }
        );
      });
      await Promise.allSettled(promises);
    }

    const remainingMissingEmailRecords = await findRecords();
    const remainingFsaRns = getFsaRns(remainingMissingEmailRecords);
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still missing LC emails - ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `Failed to insert LC emails: ${err}`);
  }
};

insertLCEmails()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Successfully finished LC emails script");
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit("info", `Failed to run LC emails script - ${err}`);
  });
