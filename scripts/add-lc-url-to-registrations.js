const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

const addLCUrls = async () => {
  try {
    let beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    logEmitter.emit("info", "addLCUrls called");

    let recordsToUpdate = await findMissingLCRegistrations(beCache);

    logEmitter.emit(
      "info",
      `${recordsToUpdate.length} records missing local_council_url`
    );

    let URLDictionary = await getLCUrls();

    for (var i = 0; i < recordsToUpdate.length; i += 50) {
      const promises = recordsToUpdate
        .slice(recordsToUpdate[i], recordsToUpdate[i + 50])
        .map(async (rec) => {
          let lcCode = rec.hygiene
            ? rec.hygiene.code
            : rec.hygieneAndStandards.code;
          let lcUrl = URLDictionary.find((x) => x._id === lcCode)
            .local_council_url;
          await beCache.updateOne(
            { "fsa-rn": rec["fsa-rn"] },
            {
              $set: { local_council_url: lcUrl }
            }
          );
        });
      await Promise.allSettled(promises);
    }

    // Log any remaining records tha are missing local_council_url
    const remainingRecordsToUpdate = await findMissingLCRegistrations(beCache);
    const remainingFSARNs = remainingRecordsToUpdate.map((rec) => {
      return rec["fsa-rn"];
    });
    logEmitter.emit(
      "info",
      `${remainingFSARNs.length} records still need to be updated: ${remainingFSARNs}`
    );
  } catch (err) {
    logEmitter.emit("info", `AddLcUrls function failed - ${err}`);
  }
};

const findMissingLCRegistrations = async (beCache) => {
  try {
    logEmitter.emit("info", "findMissingLCRegistrations called");

    const registrations = await beCache
      .find({
        local_council_url: { $exists: false }
      })
      .toArray();
    return registrations;
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to find registrations missing local_council_url - ${err}`
    );
  }
};

const getLCUrls = async () => {
  try {
    logEmitter.emit("info", "getLcUrls called");
    let lcConfigDb = await establishConnectionToCosmos(
      "config",
      "localAuthorities"
    );
    let lcUrls = await lcConfigDb
      .aggregate([{ $project: { local_council_url: 1 } }])
      .toArray();
    return lcUrls;
  } catch (err) {
    logEmitter.emit("info", `Failed to get lcUrls from lcConfigDb - ${err}`);
  }
};

addLCUrls()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit("info", "Successfully finished add lc url script");
  })
  .catch((err) => {
    closeCosmosConnection();
    logEmitter.emit("info", `Failed to run lc url script - ${err}`);
  });
