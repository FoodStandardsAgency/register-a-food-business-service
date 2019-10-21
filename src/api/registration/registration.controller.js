const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  sendTascomiRegistration,
  getRegistrationMetaData,
  getLcContactConfig,
  getLcAuth
} = require("./registration.service");

const { sendNotifications } = require("../../services/notifications.service");

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
  regDataVersion,
  sendResponse
) => {
  logEmitter.emit(
    "functionCall",
    "registration.controller",
    "createNewRegistration"
  );

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

  const completeRegistration = Object.assign(
    {},
    {
      "fsa-rn": postRegistrationMetadata["fsa-rn"],
      reg_submission_date: postRegistrationMetadata.reg_submission_date
    },
    registration,
    lcContactConfig
  );

  cacheRegistration(completeRegistration);

  const combinedResponse = Object.assign({}, postRegistrationMetadata, {
    lc_config: lcContactConfig
  });

  sendResponse(combinedResponse);
  const auth = await getLcAuth(localCouncilUrl);
  if (auth) {
    sendTascomiRegistration(
      registration,
      Object.assign({}, postRegistrationMetadata, {
        hygiene_council_code: hygieneCouncilCode
      }),
      localCouncilUrl
    );
  }

  saveRegistration(
    registration,
    postRegistrationMetadata["fsa-rn"],
    localCouncilUrl
  );

  const configVersion = await getConfigVersion(regDataVersion);

  sendNotifications(
    lcContactConfig,
    registration,
    postRegistrationMetadata,
    configVersion.notify_template_keys
  );
  logEmitter.emit(
    "functionSuccess",
    "registration.controller",
    "createNewRegistration"
  );
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
