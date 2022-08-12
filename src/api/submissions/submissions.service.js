const axios = require("axios").default;
const HttpsProxyAgent = require("https-proxy-agent");
const {
  getAllLocalCouncilConfig,
  mongodb
} = require("../../connectors/configDb/configDb.connector");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

const sendTascomiRegistration = async (registration, localCouncil) => {
  // hack to reduce repair work needed
  //let postRegistrationMetadata = registration;

  logEmitter.emit(
    "functionCall",
    "submissions.service",
    "sendTascomiRegistration"
  );

  if (!localCouncil.auth) {
    //no auth so cannot return a value
    return null;
  }

  //const auth = localCouncil.auth;
  const reg = {}; // Remove promise retry since this menthod not used

  let regParsed = JSON.parse(reg);
  let referenceIdInput = regParsed.id ? regParsed.id : null;

  if (referenceIdInput === null) {
    const err = new Error("createFoodBusinessRegistration failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  const response = {}; // Remove promise retry since this menthod not used

  if (JSON.parse(response).id === 0) {
    const err = new Error("createReferenceNumber failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  logEmitter.emit(
    "functionSuccess",
    "submissions.service",
    "sendTascomiRegistration"
  );

  return response;
};

const getRegistrationMetaData = async (councilCode) => {
  logEmitter.emit(
    "functionCall",
    "submissions.service",
    "getRegistrationMetaData"
  );

  if (process.env.NODE_ENV === "local") {
    let oId = mongodb.ObjectId();

    return {
      "fsa-rn": oId.toString(),
      reg_submission_date: new Date()
    };
  }

  const typeCode = process.env.NODE_ENV === "production" ? "001" : "000";
  const reg_submission_date = new Date();
  let fsa_rn;

  try {
    const options = {
      validateStatus: () => {
        return true;
      }
    };
    if (process.env.HTTP_PROXY) {
      options.httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      // https://github.com/axios/axios/issues/2072#issuecomment-609650888
      options.proxy = false;
    }
    const fsaRnResponse = await axios(
      `https://rng.food.gov.uk/generate/${councilCode}/${typeCode}`,

      options
    );
    if (fsaRnResponse.status === 200) {
      fsa_rn = fsaRnResponse.data;
    }

    statusEmitter.emit("incrementCount", "fsaRnCallsSucceeded");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", true);
    logEmitter.emit(
      "functionSuccess",
      "submissions.service",
      "getRegistrationMetaData"
    );
    return {
      "fsa-rn": fsa_rn ? fsa_rn["fsa-rn"] : undefined,
      reg_submission_date: reg_submission_date
    };
  } catch (err) {
    statusEmitter.emit("incrementCount", "fsaRnCallsFailed");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", false);
    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getRegistrationMetaData",
      err
    );

    const newError = new Error();
    newError.name = "fsaRnFetchError";
    newError.message = err.message;

    throw newError;
  }
};

const getLcContactConfigFromArray = async (
  localCouncilUrl,
  allCouncils = []
) => {
  logEmitter.emit(
    "functionCall",
    "submissions.service",
    "getLcContactConfigFromArray"
  );

  if (localCouncilUrl) {
    const allLcConfigData = allCouncils;

    const urlLcConfig = allLcConfigData.find(
      (localCouncil) => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      if (urlLcConfig.separate_standards_council) {
        const standardsLcConfig = allLcConfigData.find(
          (localCouncil) =>
            localCouncil._id === urlLcConfig.separate_standards_council
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: {
              code: urlLcConfig._id,
              local_council: urlLcConfig.local_council,
              local_council_notify_emails:
                urlLcConfig.local_council_notify_emails,
              local_council_email: urlLcConfig.local_council_email,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }
          if (standardsLcConfig.local_council_phone_number) {
            separateCouncils.standards.local_council_phone_number =
              standardsLcConfig.local_council_phone_number;
          }

          logEmitter.emit(
            "functionSuccess",
            "submissions.service",
            "getLcContactConfigFromArray"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${urlLcConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "submissions.service",
            "getLcContactConfigFromArray",
            newError
          );
          throw newError;
        }
      } else {
        const hygieneAndStandardsCouncil = {
          hygieneAndStandards: {
            code: urlLcConfig._id,
            local_council: urlLcConfig.local_council,
            local_council_notify_emails:
              urlLcConfig.local_council_notify_emails,
            local_council_email: urlLcConfig.local_council_email,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.local_council_phone_number) {
          hygieneAndStandardsCouncil.hygieneAndStandards.local_council_phone_number =
            urlLcConfig.local_council_phone_number;
        }

        logEmitter.emit(
          "functionSuccess",
          "submissions.service",
          "getLcContactConfigFromArray"
        );

        return hygieneAndStandardsCouncil;
      }
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "submissions.service",
        "getLcContactConfigFromArray",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getLcContactConfigFromArray",
      newError
    );
    throw newError;
  }
};

const getLcContactConfig = async (localCouncilUrl) => {
  logEmitter.emit("functionCall", "submissions.service", "getLcContactConfig");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      (localCouncil) => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      if (urlLcConfig.separate_standards_council) {
        const standardsLcConfig = allLcConfigData.find(
          (localCouncil) =>
            localCouncil._id === urlLcConfig.separate_standards_council
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: {
              code: urlLcConfig._id,
              local_council: urlLcConfig.local_council,
              local_council_notify_emails:
                urlLcConfig.local_council_notify_emails,
              local_council_email: urlLcConfig.local_council_email,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }
          if (standardsLcConfig.local_council_phone_number) {
            separateCouncils.standards.local_council_phone_number =
              standardsLcConfig.local_council_phone_number;
          }

          logEmitter.emit(
            "functionSuccess",
            "submissions.service",
            "getLcContactConfig"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${urlLcConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "submissions.service",
            "getLcContactConfig",
            newError
          );
          throw newError;
        }
      } else {
        const hygieneAndStandardsCouncil = {
          hygieneAndStandards: {
            code: urlLcConfig._id,
            local_council: urlLcConfig.local_council,
            local_council_notify_emails:
              urlLcConfig.local_council_notify_emails,
            local_council_email: urlLcConfig.local_council_email,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.local_council_phone_number) {
          hygieneAndStandardsCouncil.hygieneAndStandards.local_council_phone_number =
            urlLcConfig.local_council_phone_number;
        }

        logEmitter.emit(
          "functionSuccess",
          "submissions.service",
          "getLcContactConfig"
        );

        return hygieneAndStandardsCouncil;
      }
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "submissions.service",
        "getLcContactConfig",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getLcContactConfig",
      newError
    );
    throw newError;
  }
};

const getLcAuth = async (localCouncilUrl) => {
  logEmitter.emit("functionCall", "submissions.service", "getLcAuth");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      (localCouncil) => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      logEmitter.emit("functionSuccess", "submissions.service", "getLcAuth");
      return urlLcConfig.auth;
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "submissions.service",
        "getLcAuth",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getLcAuth",
      newError
    );
    throw newError;
  }
};

module.exports = {
  sendTascomiRegistration,
  getRegistrationMetaData,
  getLcContactConfig,
  getLcContactConfigFromArray,
  getLcAuth
};
