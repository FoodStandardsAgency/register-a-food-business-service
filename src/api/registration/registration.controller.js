const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationByFsaRn,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendEmailOfType,
  getLcContactConfig
} = require("./registration.service");

const { logEmitter } = require("../../services/logging.service");

const createNewRegistration = async (registration, localCouncilUrl) => {
  logEmitter.emit(
    "functionCall",
    "registration.controller",
    "createNewRegistration"
  );

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
  const postRegistrationMetadata = await getRegistrationMetaData();
  const tascomiResponse = await sendTascomiRegistration(
    registration,
    postRegistrationMetadata["fsa-rn"]
  );
  const tascomiObject = JSON.parse(tascomiResponse);
  const response = await saveRegistration(registration, postRegistrationMetadata["fsa-rn"]);

  const lcContactConfig = await getLcContactConfig(localCouncilUrl);

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
        lcNotificationEmailAddresses[recipientEmailAddress]
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
    fboEmailAddress
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

module.exports = { createNewRegistration, getRegistration };
