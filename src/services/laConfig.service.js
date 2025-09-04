"use strict";

const { logEmitter } = require("./logging.service");

/**
 * Gets the LA config data for the provided URL and combines all notification email addresses
 * from the local council and separate standards council if applicable.
 *
 * @returns {object} LA config object.
 */
const getLaConfigWithAllNotifyAddresses = async (localCouncilUrl, allLaConfigData = []) => {
  logEmitter.emit("functionCall", "laConfig.service", "getLaConfigWithAllNotifyAddresses");

  const laConfig = allLaConfigData.find(
    (localCouncil) => localCouncil.local_council_url === localCouncilUrl
  );

  if (laConfig) {
    laConfig.tradingStatusLaEmailAddresses = [...laConfig.local_council_notify_emails];

    if (laConfig.separate_standards_council) {
      const standardsLcConfig = allLaConfigData.find(
        (localCouncil) => localCouncil._id === laConfig.separate_standards_council
      );

      if (standardsLcConfig) {
        laConfig.tradingStatusStandardsEmailAddresses = [
          ...standardsLcConfig.local_council_notify_emails
        ];
      } else {
        const newError = new Error();
        newError.name = "localCouncilNotFound";
        newError.message = `A separate standards council config with the code "${laConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
        logEmitter.emit(
          "functionFail",
          "laConfig.service",
          "getLaConfigWithAllNotifyAddresses",
          newError
        );
        throw newError;
      }
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = `Config for "${localCouncilUrl}" not found`;
    logEmitter.emit(
      "functionFail",
      "laConfig.service",
      "getLaConfigWithAllNotifyAddresses",
      newError
    );
    throw newError;
  }

  logEmitter.emit("functionSuccess", "laConfig.service", "getLaConfigWithAllNotifyAddresses");
  return laConfig;
};

module.exports = {
  getLaConfigWithAllNotifyAddresses
};
