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

const { getUprn } = require("../../connectors/address-lookup/address-matcher");

const {
  findCouncilByUrl,
  findCouncilById,
  connectToConfigDb,
  LocalCouncilConfigDbCollection
} = require("../../connectors/configDb/configDb.connector");

const {
  mapFromCollectionsRegistration
} = require("../../utils/registrationMapper");

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
      reg_submission_date: postRegistrationMetadata.reg_submission_date,
      directLcSubmission: false
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
      source_council_id: sourceCouncil._id,
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

const createNewLcRegistration = async (
  registration,
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

  // Convert to correct format
  const mappedRegistration = mapFromCollectionsRegistration(registration);

  // RESOLUTION
  let configDb = await connectToConfigDb();
  const lcConfigCollection = await LocalCouncilConfigDbCollection(configDb);

  // Get Council details
  const sourceCouncil = await findCouncilById(
    lcConfigCollection,
    registration.competent_authority_id
  );

  // Validate according to correct schema
  const errors = validate(mappedRegistration, true);
  if (errors.length) {
    const err = new Error();
    err.name = "validationError";
    err.validationErrors = errors;
    throw err;
  }

  // Get UPRN of establishment and operator
  const promises = [];
  if (!mappedRegistration.establishment.operator.operator_uprn) {
    promises.push(
      getUprn(
        mappedRegistration.establishment.operator.operator_address_line_1,
        mappedRegistration.establishment.operator.operator_postcode
      ).then(
        (result) =>
          (mappedRegistration.establishment.operator.operator_uprn = result)
      )
    );
  }

  if (!mappedRegistration.establishment.premise.establishment_uprn) {
    promises.push(
      getUprn(
        mappedRegistration.establishment.premise.establishment_address_line_1,
        mappedRegistration.establishment.premise.establishment_postcode
      ).then(
        (result) =>
          (mappedRegistration.establishment.premise.establishment_uprn = result)
      )
    );
  }

  await Promise.all(promises);

  //left here as legacy code
  const lcContactConfig = await getLcContactConfig(
    sourceCouncil.local_council_url
  );

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
      reg_submission_date: postRegistrationMetadata.reg_submission_date,
      directLcSubmission: true
    },
    mappedRegistration,
    lcContactConfig,
    {
      status: status
    },
    {
      hygiene_council_code: hygieneCouncilCode,
      local_council_url: sourceCouncil.local_council_url,
      source_council_id: sourceCouncil._id,
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
    "createNewLcRegistration"
  );
};

const getRegistration = async (fsa_rn) => {
  const response = await getFullRegistrationByFsaRn(fsa_rn);

  return response;
};

const deleteRegistration = async (fsa_rn) => {
  const response = await deleteRegistrationByFsaRn(fsa_rn);

  return response;
};

module.exports = {
  createNewRegistration,
  createNewLcRegistration,
  getRegistration,
  deleteRegistration
};
