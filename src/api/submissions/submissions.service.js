const axios = require("axios");
const uuid = require("uuid");
const HttpsProxyAgent = require("https-proxy-agent");
const {
  getAllLocalCouncilConfig,
  mongodb
} = require("../../connectors/configDb/configDb.connector");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const { RNG_API_URL } = require("../../config");

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

  const reg_submission_date = new Date();
  let fsa_rn;

  fsa_rn = await getFsaRn(councilCode);

  return {
    "fsa-rn": fsa_rn ? fsa_rn : "tmp_" + uuid.v4(),
    reg_submission_date: reg_submission_date
  };
};

const getFsaRn = async (councilCode) => {
  const typeCode = process.env.NODE_ENV === "production" ? "001" : "000";

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
      `${RNG_API_URL}/generate/${councilCode}/${typeCode}`,
      options
    );
    if (fsaRnResponse.status === 200) {
      statusEmitter.emit("incrementCount", "fsaRnCallsSucceeded");
      statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", true);
      logEmitter.emit("functionSuccess", "submissions.service", "getFsaRn");
      return fsaRnResponse.data && fsaRnResponse.data["fsa-rn"]
        ? fsaRnResponse.data["fsa-rn"]
        : false;
    }

    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getFsaRn",
      `Response code ${fsaRnResponse.status}`
    );
    return false;
  } catch (err) {
    statusEmitter.emit("incrementCount", "fsaRnCallsFailed");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", false);
    logEmitter.emit("functionFail", "submissions.service", "getFsaRn", err);
    return false;
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
              local_council_guidance_link:
                urlLcConfig.local_council_guidance_link,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              local_council_guidance_link:
                standardsLcConfig.local_council_guidance_link,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.new_authority_name) {
            separateCouncils.hygiene.new_authority_name =
              urlLcConfig.new_authority_name;
          }

          if (urlLcConfig.new_authority_id) {
            separateCouncils.hygiene.new_authority_id =
              urlLcConfig.new_authority_id;
          }

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }

          if (standardsLcConfig.new_authority_name) {
            separateCouncils.standards.new_authority_name =
              standardsLcConfig.new_authority_name;
          }

          if (standardsLcConfig.new_authority_id) {
            separateCouncils.standards.new_authority_id =
              standardsLcConfig.new_authority_id;
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
            local_council_guidance_link:
              urlLcConfig.local_council_guidance_link,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.new_authority_name) {
          hygieneAndStandardsCouncil.hygieneAndStandards.new_authority_name =
            urlLcConfig.new_authority_name;
        }

        if (urlLcConfig.new_authority_id) {
          hygieneAndStandardsCouncil.hygieneAndStandards.new_authority_id =
            urlLcConfig.new_authority_id;
        }

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
              local_council_guidance_link:
                urlLcConfig.local_council_guidance_link,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              local_council_guidance_link:
                standardsLcConfig.local_council_guidance_link,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.new_authority_name) {
            separateCouncils.hygiene.new_authority_name =
              urlLcConfig.new_authority_name;
          }

          if (urlLcConfig.new_authority_id) {
            separateCouncils.hygiene.new_authority_id =
              urlLcConfig.new_authority_id;
          }

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }

          if (standardsLcConfig.new_authority_name) {
            separateCouncils.standards.new_authority_name =
              standardsLcConfig.new_authority_name;
          }

          if (standardsLcConfig.new_authority_id) {
            separateCouncils.standards.new_authority_id =
              standardsLcConfig.new_authority_id;
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
            local_council_guidance_link:
              urlLcConfig.local_council_guidance_link,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.new_authority_name) {
          hygieneAndStandardsCouncil.hygieneAndStandards.new_authority_name =
            urlLcConfig.new_authority_name;
        }

        if (urlLcConfig.new_authority_id) {
          hygieneAndStandardsCouncil.hygieneAndStandards.new_authority_id =
            urlLcConfig.new_authority_id;
        }

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
  getRegistrationMetaData,
  getLcContactConfig,
  getLcContactConfigFromArray,
  getLcAuth,
  getFsaRn
};
