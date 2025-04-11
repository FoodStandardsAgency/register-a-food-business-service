"use strict";

const getLaNotifyAddresses = async (localCouncilUrl, allLaConfigData = []) => {
  logEmitter.emit("functionCall", "laConfig.service", "getLaNotifyAddresses");

  const laConfig = allLaConfigData.find(
    (localCouncil) => localCouncil.local_council_url === localCouncilUrl
  );

  if (laConfig) {
    laConfig.tradingStatusEmailAddresses = [...laConfig.local_council_notify_emails];

    if (laConfig.separate_standards_council) {
      const standardsLcConfig = allLaConfigData.find(
        (localCouncil) => localCouncil._id === laConfig.separate_standards_council
      );

      if (standardsLcConfig) {
        laConfig.tradingStatusEmailAddresses.push(...standardsLcConfig.local_council_notify_emails);
      } else {
        const newError = new Error();
        newError.name = "localCouncilNotFound";
        newError.message = `A separate standards council config with the code "${laConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
        logEmitter.emit("functionFail", "laConfig.service", "getLaNotifyAddresses", newError);
        throw newError;
      }
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = `Config for "${localCouncilUrl}" not found`;
    logEmitter.emit("functionFail", "laConfig.service", "getLaNotifyAddresses", newError);
    throw newError;
  }

  logEmitter.emit("functionSuccess", "laConfig.service", "getLaNotifyAddresses");
  return laConfig;
};
