const { connectToBeCacheDb } = require("../src/connectors/cacheDb/cacheDb.connector");
const { getRegistrationByFsaRn } = require("../src/connectors/registrationDb/registrationDb");
const { connectToDb } = require("../src/db/db");
const { logEmitter } = require("../src/services/logging.service");


const addFieldsToCosmos = () => {
    const beCache = await connectToBeCacheDb();

    const records = await beCache.find({"collected":{$exists: false}}).toArray();

    const promises = records.map(async (rec) => {
        await addFieldsToRecord(rec).then(() => {
            logEmitter.emit("info", `Successfully updated BE Cache FSA-RN: ${rec["fsa-rn"]}`);
        });
    });
    await Promise.allSettled(promises);
};

const addFieldsToRecord = (rec) => {
    await connectToDb();

    // Grab fields for each record from their corresponding registration in PG
    const registration = await getRegistrationByFsaRn(rec["fsa-rn"]);
    if (!registration) {
        logEmitter.emit("info", `No registration found in PG for ${rec["fsa-rn"]}`);
        return
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
            {"fsa-rn": rec["fsa-rn"] },
            {
                $set: {
                    "collected": collected,
                    "collected_at": collected_at,
                    "createdAt": createdAt,
                    "updatedAt": updatedAt,
                    "direct_submission": direct_submission,
                }
            }
        );
    } catch (err) {
        logEmitter.emit("info", `Failed to update BE Cache FSA-RN: ${rec["fsa-rn"]} ${err.message}`);
    }
}

module.exports = { addFieldsToCosmos };