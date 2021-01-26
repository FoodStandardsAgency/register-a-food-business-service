const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const promiseRetry = require("promise-retry");
const { INFO } = require("../../services/logging.service");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const {
  getAllLocalCouncilConfig,
  mongodb
} = require("../../connectors/configDb/configDb.connector");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");


const sendTascomiRegistration = async (registration, localCouncil) => {
  // hack to reduce repair work needed
  let postRegistrationMetadata = registration;

  logEmitter.emit(
    "functionCall",
    "registration.service",
    "sendTascomiRegistration"
  );

  if (!localCouncil.auth) {
    //no auth so cannot return a value
    return null;
  }

  const auth = localCouncil.auth;
  const reg = await promiseRetry({ retries: 3 }, (retry, number) => {
    logEmitter.emit(INFO, `createdFoodBusinessRegistration attempt ${number}`);
    return createFoodBusinessRegistration(
      registration,
      postRegistrationMetadata,
      auth
    ).catch(retry);
  });

  let regParsed = JSON.parse(reg);
  let referenceIdInput = regParsed.id ? regParsed.id : null;

  if (referenceIdInput === null) {
    const err = new Error("createFoodBusinessRegistration failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  const response = await promiseRetry({ retries: 3 }, (retry, number) => {
    logEmitter.emit(INFO, `createdReferenceNumber attempt ${number}`);
    return createReferenceNumber(referenceIdInput, auth).catch(retry);
  });

  if (JSON.parse(response).id === 0) {
    const err = new Error("createReferenceNumber failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "sendTascomiRegistration"
  );

  return response;
};

const getRegistrationMetaData = async (councilCode) => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
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
    const options = {};
    if (process.env.HTTP_PROXY) {
      options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    }
    const fsaRnResponse = await fetch(
      `https://fsa-reference-numbers.epimorphics.net/generate/${councilCode}/${typeCode}`,
      options
    );
    if (fsaRnResponse.status === 200) {
      fsa_rn = await fsaRnResponse.json();
    }

    statusEmitter.emit("incrementCount", "fsaRnCallsSucceeded");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", true);
    logEmitter.emit(
      "functionSuccess",
      "registration.service",
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
      "registrationService",
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
    "registration.service",
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
            "registration.service",
            "getLcContactConfigFromArray"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${urlLcConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "registration.service",
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
          "registration.service",
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
        "registration.service",
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
      "registration.service",
      "getLcContactConfigFromArray",
      newError
    );
    throw newError;
  }
};

const getLcContactConfig = async (localCouncilUrl) => {
  logEmitter.emit("functionCall", "registration.service", "getLcContactConfig");

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
            "registration.service",
            "getLcContactConfig"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${urlLcConfig.separate_standards_council}" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "registration.service",
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
          "registration.service",
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
        "registration.service",
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
      "registration.service",
      "getLcContactConfig",
      newError
    );
    throw newError;
  }
};

const getLcAuth = async (localCouncilUrl) => {
  logEmitter.emit("functionCall", "registration.service", "getLcAuth");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      (localCouncil) => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      logEmitter.emit("functionSuccess", "registration.service", "getLcAuth");
      return urlLcConfig.auth;
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "registration.service",
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
      "registration.service",
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
