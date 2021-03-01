const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let recordsUpdated = [];
let recordsFailedToUpdate = [];

const updateDates = async () => {
  const beCache = await establishConnectionToCosmos(
    "registrations",
    "registrations"
  );

  const records = await beCache
    .find({ reg_submission_date: { $type: 2 } })
    .toArray();

  const promises = records.map(async (rec) => {
    logEmitter.emit(
      "info",
      `Updating BE Cache FSA-RN: ${rec["fsa-rn"]} date fields`
    );
    try {
      const setObject = Object.assign(
        {
          reg_submission_date: new Date(rec.reg_submission_date)
        },
        rec.status.notifications
          ? ({
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
              : [])
          : {}
      );

      await beCache.updateOne(
        { "fsa-rn": rec["fsa-rn"] },
        {
          $set: setObject
        }
      );
      recordsUpdated.push(rec["fsa-rn"]);
    } catch (err) {
      recordsFailedToUpdate.push(rec["fsa-rn"]);
      logEmitter.emit(
        "info",
        `Failed to update BE Cache FSA-RN: ${rec["fsa-rn"]} date fields ${err.message}`
      );
    }
  });

  logEmitter.emit(
    "info",
    `Successfully updated dates of ${recordsUpdated.length} records in cosmos: ${recordsUpdated}`
  );
  logEmitter.emit(
    "info",
    `Dates of ${recordsFailedToUpdate.length} records failed to update in cosmos: ${recordsFailedToUpdate}`
  );
  return Promise.allSettled(promises);
};

updateDates()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Successfully finished update dates script");
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run update dates script");
  });
