const axios = require("axios");
const uuid = require("uuid");
const HttpsProxyAgent = require("https-proxy-agent");
const { getAllLocalCouncilConfig, mongodb } = require("../connectors/configDb/configDb.connector");

const { logEmitter } = require("./logging.service");
const { RNG_API_URL } = require("../config");

const getRegistrationMetaData = async (councilCode) => {
  logEmitter.emit("functionCall", "submissions.service", "getRegistrationMetaData");

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
      logEmitter.emit("info", "FSA Registration Number lookup success"); // Used for Azure alerts
      logEmitter.emit("functionSuccess", "submissions.service", "getFsaRn");
      return fsaRnResponse.data && fsaRnResponse.data["fsa-rn"]
        ? fsaRnResponse.data["fsa-rn"]
        : false;
    }

    logEmitter.emit("warning", "FSA Registration Number lookup failure"); // Used for Azure alerts
    logEmitter.emit(
      "functionFail",
      "submissions.service",
      "getFsaRn",
      `Response code ${fsaRnResponse.status}`
    );
    return false;
  } catch (err) {
    logEmitter.emit("warning", "FSA Registration Number lookup failure"); // Used for Azure alerts
    logEmitter.emit("functionFail", "submissions.service", "getFsaRn", err);
    return false;
  }
};

const getCouncilFromConfigData = (configCouncil, standards) => {
  let council = {
    code: configCouncil._id,
    local_council: configCouncil.local_council,
    local_council_notify_emails: configCouncil.local_council_notify_emails,
    local_council_email: configCouncil.local_council_email,
    local_council_guidance_link: configCouncil.local_council_guidance_link,
    hasAuth: configCouncil.auth ? true : false
  };

  if (!standards) {
    council.country = configCouncil.country;
  }

  if (configCouncil.new_authority_name) {
    council.new_authority_name = configCouncil.new_authority_name;
  }

  if (configCouncil.new_authority_id) {
    council.new_authority_id = configCouncil.new_authority_id;
  }

  if (configCouncil.local_council_phone_number) {
    council.local_council_phone_number = configCouncil.local_council_phone_number;
  }

  return council;
};

const getLcContactConfigFromArray = async (localCouncilUrl, allCouncils = []) => {
  logEmitter.emit("functionCall", "submissions.service", "getLcContactConfigFromArray");

  if (localCouncilUrl) {
    const allLcConfigData = allCouncils;

    const urlLcConfig = allLcConfigData.find(
      (localCouncil) => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      const emailReplyToId = urlLcConfig.local_council_email_reply_to_ID;

      if (urlLcConfig.separate_standards_council) {
        const standardsLcConfig = allLcConfigData.find(
          (localCouncil) => localCouncil._id === urlLcConfig.separate_standards_council
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: getCouncilFromConfigData(urlLcConfig),
            standards: getCouncilFromConfigData(standardsLcConfig, true)
          };

          if (emailReplyToId) {
            separateCouncils["emailReplyToId"] = emailReplyToId;
          }

          logEmitter.emit("functionSuccess", "submissions.service", "getLcContactConfigFromArray");

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
          hygieneAndStandards: getCouncilFromConfigData(urlLcConfig)
        };
        if (emailReplyToId) {
          hygieneAndStandardsCouncil["emailReplyToId"] = emailReplyToId;
        }
        logEmitter.emit("functionSuccess", "submissions.service", "getLcContactConfigFromArray");

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
    logEmitter.emit("functionFail", "submissions.service", "getLcContactConfigFromArray", newError);
    throw newError;
  }
};

const getLcContactConfig = async (localCouncilUrl) => {
  const allLcConfigData = await getAllLocalCouncilConfig();

  return getLcContactConfigFromArray(localCouncilUrl, allLcConfigData);
};

module.exports = {
  getRegistrationMetaData,
  getLcContactConfig,
  getLcContactConfigFromArray,
  getFsaRn
};
