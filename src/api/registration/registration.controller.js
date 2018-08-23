const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail,
  sendLcEmail,
  getLcEmailConfig
} = require("./registration.service");

const { logEmitter } = require("../../services/logging.service");

const createNewRegistration = async registration => {
  logEmitter.emit(
    "functionCall",
    "registration.controller",
    "createNewRegistration"
  );
  // AUTHENTICATION

  // VALIDATION
  if (registration === undefined) {
    throw new Error("registration is undefined");
  }
  const errors = validate(registration);
  if (errors.length) {
    const err = new Error();
    err.name = "validationError";
    err.validationErrors = errors;
    throw err;
  }

  // RESOLUTION
  const metaDataResponse = await getRegistrationMetaData();
  const tascomiResponse = await sendTascomiRegistration(
    registration,
    metaDataResponse["fsa-rn"]
  );
  const tascomiObject = JSON.parse(tascomiResponse);
  const response = await saveRegistration(registration);

  const lcEmailConfig = getLcEmailConfig();

  const emailFormatLcConfig = {};

  if (Object.keys(lcEmailConfig).length === 1) {
    emailFormatLcConfig.local_council =
      lcEmailConfig.hygieneAndStandards.lcName;
    emailFormatLcConfig.local_council_email =
      lcEmailConfig.hygieneAndStandards.lcContactEmail;
  } else {
    emailFormatLcConfig.local_council_hygiene = lcEmailConfig.hygiene.lcName;
    emailFormatLcConfig.local_council_hygiene_email =
      lcEmailConfig.hygiene.lcContactEmail;
    emailFormatLcConfig.local_council_standards =
      lcEmailConfig.standards.lcName;
    emailFormatLcConfig.local_council_standards_email =
      lcEmailConfig.standards.lcContactEmail;
  }

  const emailSuccessesOrFailuresLc = {};

  for (let typeOfCouncil in lcEmailConfig) {
    emailSuccessesOrFailuresLc[typeOfCouncil] = await sendLcEmail(
      registration,
      metaDataResponse,
      emailFormatLcConfig
    );
  }

  const emailSuccessOrFailureFbo = await sendFboEmail(
    registration,
    metaDataResponse,
    emailFormatLcConfig
  );

  const combinedResponse = Object.assign(
    response,
    metaDataResponse,
    {
      tascomiResponse: tascomiObject
    },
    { email_success_fbo: emailSuccessOrFailureFbo },
    { email_success_lc: emailSuccessesOrFailuresLc },
    { lc_config: lcEmailConfig }
  );

  logEmitter.emit(
    "functionSuccess",
    "registration.controller",
    "createNewRegistration"
  );
  return combinedResponse;
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
