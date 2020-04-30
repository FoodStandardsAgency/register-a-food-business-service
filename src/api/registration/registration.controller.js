const { validate } = require("../../services/validation.service");
const {
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  getRegistrationMetaData,
  getLcContactConfig
} = require("./registration.service");

const {
  cacheRegistration
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
  findCouncilByUrl,
  connectToConfigDb,
  LocalCouncilConfigDbCollection
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
  let configDb = await connectToConfigDb();
  const lcConfigCollection = await LocalCouncilConfigDbCollection(configDb);

  const sourceCouncil = await findCouncilByUrl(
    lcConfigCollection,
    localCouncilUrl
  );

  //left here as legacy code
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

  const status = {
    registration: null,
    notifications: null
  };
  if (sourceCouncil.auth) {
    status.tascomi = {};
  }

  //this is all very messy but ported from legacy code.
  const completeCacheRecord = Object.assign(
    {},
    {
      "fsa-rn": postRegistrationMetadata["fsa-rn"],
      reg_submission_date: postRegistrationMetadata.reg_submission_date
    },
    registration,
    lcContactConfig,
    {
      status: status
    },
    {
      hygiene_council_code: hygieneCouncilCode,
      local_council_url: localCouncilUrl,
      //the council id resolved from the localCouncilUrl
      source_council_id: sourceCouncil.id,
      registration_data_version: regDataVersion
    },
    postRegistrationMetadata
  );

  await cacheRegistration(completeCacheRecord);

  const combinedResponse = Object.assign({}, postRegistrationMetadata, {
    lc_config: lcContactConfig
  });

  sendResponse(combinedResponse);

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
