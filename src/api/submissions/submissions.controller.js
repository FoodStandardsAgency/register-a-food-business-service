const { validate } = require("../../services/validation.service");
const {
  getRegistrationMetaData,
  getLcContactConfig
} = require("./submissions.service");

const {
  cacheRegistration
} = require("../../connectors/cacheDb/cacheDb.connector");

const { getUprn } = require("../../connectors/address-lookup/address-matcher");

const {
  findCouncilByUrl,
  getCouncilsForSupplier
} = require("../../connectors/configDb/configDb.connector");

const {
  establishConnectionToCosmos
} = require("../../connectors/cosmos.client");

const {
  mapFromCollectionsRegistration
} = require("../../utils/registrationMapper");

const { logEmitter } = require("../../services/logging.service");

const createNewRegistration = async (
  registration,
  localCouncilUrl,
  submission_language,
  manual_local_authority,
  regDataVersion
) => {
  logEmitter.emit(
    "functionCall",
    "submissions.controller",
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
  const lcConfigCollection = await establishConnectionToCosmos(
    "config",
    "localAuthorities"
  );

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

  const postRegistrationMetadata =
    await getRegistrationMetaData(hygieneCouncilCode);

  const status = {
    notifications: null
  };

  //this is all very messy but ported from legacy code.
  const completeCacheRecord = Object.assign(
    {},
    {
      "fsa-rn": postRegistrationMetadata["fsa-rn"],
      reg_submission_date: postRegistrationMetadata.reg_submission_date,
      direct_submission: false,
      collected: false,
      collected_at: null,
      submission_language: submission_language,
      manual_local_authority: manual_local_authority
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

  logEmitter.emit(
    "functionSuccess",
    "submissions.controller",
    "createNewRegistration"
  );

  return combinedResponse;
};

const createNewDirectRegistration = async (registration, options) => {
  logEmitter.emit(
    "functionCall",
    "submissions.controller",
    "createNewDirectRegistration"
  );

  if (registration === undefined) {
    throw new Error("registration is undefined");
  }

  // Validate according to correct schema
  const errors = validate(registration, true);
  if (errors.length) {
    const err = new Error();
    err.name = "validationError";
    err.validationErrors = errors;
    throw err;
  }

  // Convert to correct format
  const mappedRegistration = mapFromCollectionsRegistration(registration);

  // RESOLUTION
  const lcConfigCollection = await establishConnectionToCosmos(
    "config",
    "localAuthorities"
  );

  if (options.requestedCouncil !== options.subscriber) {
    // Check supplier authorized to access requested council
    const validCouncils = await getCouncilsForSupplier(options.subscriber);
    if (validCouncils.indexOf(options.requestedCouncil) < 0) {
      const newError = new Error();
      newError.name = "supplierCouncilNotFound";
      logEmitter.emit(
        "functionFail",
        "submissions.controller",
        "createNewDirectRegistration",
        newError
      );
      throw newError;
    }
  }

  // Get Council details
  const sourceCouncil = await findCouncilByUrl(
    lcConfigCollection,
    options.requestedCouncil
  );
  if (!sourceCouncil) {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = `Config for council ID "${options.requestedCouncil}" not found`;
    logEmitter.emit(
      "functionFail",
      "submissions.controller",
      "createNewDirectRegistration",
      newError
    );
    throw newError;
  }

  // Get UPRN of establishment and operator
  const promises = [];
  if (!mappedRegistration.establishment.operator.operator_uprn) {
    promises.push(
      getUprn(
        mappedRegistration.establishment.operator.operator_address_line_1,
        mappedRegistration.establishment.operator.operator_address_line_2,
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
        mappedRegistration.establishment.premise.establishment_address_line_2,
        mappedRegistration.establishment.premise.establishment_postcode
      ).then(
        (result) =>
          (mappedRegistration.establishment.premise.establishment_uprn = result)
      )
    );
  }

  //left here as legacy code
  let lcContactConfig;
  promises.push(
    getLcContactConfig(sourceCouncil.local_council_url).then(
      (result) => (lcContactConfig = result)
    )
  );

  // Wait for asyncs to catch up
  await Promise.allSettled(promises);

  let hygieneCouncilCode;
  if (lcContactConfig.hygieneAndStandards) {
    hygieneCouncilCode = lcContactConfig.hygieneAndStandards.code;
  } else {
    hygieneCouncilCode = lcContactConfig.hygiene.code;
  }

  const regMetadata = {
    "fsa-rn": registration.fsa_rn,
    reg_submission_date: new Date(),
    direct_submission: true,
    collected: true,
    collected_at: new Date()
  };

  if (!regMetadata["fsa-rn"]) {
    await getRegistrationMetaData(hygieneCouncilCode).then(
      (result) => (regMetadata["fsa-rn"] = result["fsa-rn"])
    );
  }

  const status = {
    notifications: null
  };

  var supplierDetails = {};
  if (options.requestedCouncil !== options.subscriber) {
    supplierDetails = {
      supplier_url: options.subscriber
    };
  }

  const completeCacheRecord = Object.assign(
    {},
    regMetadata,
    mappedRegistration,
    lcContactConfig,
    {
      status: status
    },
    {
      hygiene_council_code: hygieneCouncilCode,
      local_council_url: sourceCouncil.local_council_url,
      source_council_id: sourceCouncil._id,
      api_version: options.apiVersion
    },
    supplierDetails
  );

  await cacheRegistration(completeCacheRecord);

  const response = { "fsa-rn": regMetadata["fsa-rn"] };

  logEmitter.emit(
    "functionSuccess",
    "submissions.controller",
    "createNewDirectRegistration"
  );

  return response;
};

module.exports = {
  createNewRegistration,
  createNewDirectRegistration
};
