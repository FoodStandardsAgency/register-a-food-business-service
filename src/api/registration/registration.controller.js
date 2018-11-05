const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendEmailOfType,
  getLcContactConfig
} = require("./registration.service");

const {
  cacheRegistration
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
  getConfigVersion
} = require("../../connectors/configDb/configDb.connector");

const { logEmitter } = require("../../services/logging.service");

const createNewRegistration = async (
  registration,
  localCouncilUrl,
  regDataVersion
) => {
  logEmitter.emit(
    "functionCall",
    "registration.controller",
    "createNewRegistration"
  );

  if (registration === undefined) {
    throw new Error("registration is undefined");
  }

  cacheRegistration(registration);

  const configVersion = await getConfigVersion(regDataVersion);

  const errors = validate(registration);
  if (errors.length) {
    const err = new Error();
    err.name = "validationError";
    err.validationErrors = errors;
    throw err;
  }

  // RESOLUTION
  const lcContactConfig = await getLcContactConfig(localCouncilUrl);

  let hygieneCouncilCode;
  if (lcContactConfig.hygieneAndStandards) {
    hygieneCouncilCode = lcContactConfig.hygieneAndStandards.code;
  } else {
    hygieneCouncilCode = lcContactConfig.hygiene.code;
  }

  const postRegistrationMetadata = await getRegistrationMetaData(
    hygieneCouncilCode
  );

  const tascomiResponse = await sendTascomiRegistration(
    registration,
    Object.assign({}, postRegistrationMetadata, {
      hygiene_council_code: hygieneCouncilCode
    }),
    localCouncilUrl
  );

  const tascomiObject = JSON.parse(tascomiResponse);
  const response = await saveRegistration(
    registration,
    postRegistrationMetadata["fsa-rn"],
    localCouncilUrl
  );
  const notifySuccessOrFailureLc = {};

  for (let typeOfCouncil in lcContactConfig) {
    const lcNotificationEmailAddresses =
      lcContactConfig[typeOfCouncil].local_council_notify_emails;

    for (let recipientEmailAddress in lcNotificationEmailAddresses) {
      notifySuccessOrFailureLc[typeOfCouncil] = await sendEmailOfType(
        "LC",
        registration,
        postRegistrationMetadata,
        lcContactConfig,
        lcNotificationEmailAddresses[recipientEmailAddress],
        configVersion.notify_template_keys
      );
    }
  }

  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  const notifySuccessOrFailureFbo = await sendEmailOfType(
    "FBO",
    registration,
    postRegistrationMetadata,
    lcContactConfig,
    fboEmailAddress,
    configVersion.notify_template_keys
  );

  const combinedResponse = Object.assign(
    response,
    postRegistrationMetadata,
    {
      tascomiResponse: tascomiObject
    },
    { email_fbo: notifySuccessOrFailureFbo },
    { email_lc: notifySuccessOrFailureLc },
    { lc_config: lcContactConfig }
  );

  logEmitter.emit(
    "functionSuccess",
    "registration.controller",
    "createNewRegistration"
  );

  return combinedResponse;
};

const getRegistration = async fsa_rn => {
  const response = await getFullRegistrationByFsaRn(fsa_rn);

  return response;
};

const deleteRegistration = async fsa_rn => {
  const response = await deleteRegistrationByFsaRn(fsa_rn);

  return response;
};

module.exports = { createNewRegistration, getRegistration, deleteRegistration };
