const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let recordsToUpdate = [];

const updateDates = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    //Find records that need updating in cosmos
    recordsToUpdate = await findRecordsToUpdate();

    logEmitter.emit(
      "info",
      `Updating fields of ${recordsToUpdate.length} records in cosmos`
    );
    //Update records in cosmos
    logEmitter.emit("info", "Updating dates in cosmos...");
    while (recordsToUpdate.length > 0) {
      const promises = recordsToUpdate.slice(0, 50).map(async (rec) => {
        recordsToUpdate = recordsToUpdate.filter((reg) => {
          return reg !== rec;
        });
        await updateRecordDates(rec);
      });
      await Promise.allSettled(promises);
    }
    // Log any registration numbers that failed to update.
    const remainingRecordsToUpdate = await findRecordsToUpdate();
    const remainingFsaRns = remainingRecordsToUpdate.map((rec) => {
      return rec["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `${remainingFsaRns.length} records still needing to be updated: ${remainingFsaRns}`
    );
  } catch (err) {
    logEmitter.emit("info", `updateDates failed - ${err}`);
  }
};

const findRecordsToUpdate = async () => {
  try {
    const records = await beCache
      .find({ reg_submission_date: { $type: 2 } })
      .toArray();

    return records;
  } catch (err) {
    logEmitter.emit("info", `findRecordsToUpdate (dates) failed -${err}`);
  }
};

const updateRecordDates = async (rec) => {
  try {
    const setObject = Object.assign(
      {
        reg_submission_date: new Date(rec.reg_submission_date)
      },
      {
        "status.notifications.0.time": new Date(
          rec.status.notifications[0].time
        ),
        "status.notifications.1.time": new Date(
          rec.status.notifications[1].time
        )
      },
      rec.status.notifications[2]
        ? {
            "status.notifications.2.time": new Date(
              rec.status.notifications[2].time
            )
          }
        : [],
      rec.status.notifications[3]
        ? {
            "status.notifications.3.time": new Date(
              rec.status.notifications[3].time
            )
          }
        : [],
      rec.status.notifications[4]
        ? {
            "status.notifications.4.time": new Date(
              rec.status.notifications[4].time
            )
          }
        : []
    );

    await beCache.updateOne(
      { "fsa-rn": rec["fsa-rn"] },
      {
        $set: setObject
      }
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to update records: ${rec["fsa-rn"]} date fields ${err.message}`
    );
  }
};

updateDates()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Successfully finished update dates script");
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit("info", `Failed to run update dates script - ${err}`);
  });
