const {
  establishConnectionToMongo
} = require("../src/connectors/cacheDb/cacheDb.connector");
const { logEmitter } = require("../src/services/logging.service");

const updateDates = async () => {
  const beCache = await establishConnectionToMongo();

  const records = await beCache.find({}).toArray();

  const promises = records.map(async (rec) => {
    logEmitter.emit(
      "info",
      `Updating BE Cache FSA-RN: ${rec["fsa-rn"]} date fields`
    );
    try {
      const setObject = Object.assign(
        {
          reg_submission_date: new Date(rec.reg_submission_date),
          collected_at: new Date(rec.collected_at),
          createdAt: new Date(rec.createdAt),
          updatedAt: new Date(rec.updatedAt),
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
      logEmitter.emit(
        "info",
        `Successfully updated BE Cache FSA-RN: ${rec["fsa-rn"]} date fields`
      );
    } catch (err) {
      logEmitter.emit(
        "info",
        `Failed to update BE Cache FSA-RN: ${rec["fsa-rn"]} date fields ${err.message}`
      );
    }
  });
  await Promise.allSettled(promises);
  return;
};

//updateDates();

module.exports = { updateDates };
