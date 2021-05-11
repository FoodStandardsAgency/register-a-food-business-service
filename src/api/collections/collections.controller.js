const {
  getSingleRegistration,
  getAllRegistrationsByCouncil,
  getUnifiedRegistrations,
  updateRegistrationCollectedByCouncil
} = require("../../connectors/registrationsDb/registrationsDb.connector");

const { validateOptions } = require("./collections.service");
const {
  registrationDbDouble
} = require("../../connectors/registrationsDb/registrationsDb.double");
const {
  transformRegForCollections
} = require("../../services/collectionsTransform.service");

const { logEmitter } = require("../../services/logging.service");
const {
  transformEnumsForCollections
} = require("../../services/transformEnums.service");
const version = 1;

const getRegistrationsByCouncil = async (options) => {
  logEmitter.emit(
    "functionCall",
    "registrations.controller",
    "getRegistrationsByCouncil"
  );

  const validationResult = await validateOptions(options, true);

  if (validationResult === true) {
    if (options.double_mode) {
      return registrationDbDouble(options.double_mode);
    }
    const registrations = await getAllRegistrationsByCouncil(
      options.council,
      options.new,
      options.fields,
      options.before,
      options.after
    );

    const formattedRegistrations = registrations.map((registration) => {
      return transformRegForCollections(registration);
    });
    transformEnumsForCollections(version, formattedRegistrations);
    logEmitter.emit(
      "functionSuccess",
      "registrations.controller",
      "getRegistrationsByCouncil"
    );
    return formattedRegistrations;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const getRegistration = async (options) => {
  logEmitter.emit(
    "functionCall",
    "registrations.controller",
    "getRegistration"
  );

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    if (options.double_mode) {
      return registrationDbDouble(options.double_mode);
    }
    const registration = await getSingleRegistration(
      options.fsa_rn,
      options.council
    );

    const formattedRegistration = transformRegForCollections(registration);
    transformEnumsForCollections(version, formattedRegistration);
    logEmitter.emit(
      "functionSuccess",
      "registrations.controller",
      "getRegistration"
    );
    return formattedRegistration;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const getRegistrations = async (options) => {
  logEmitter.emit(
    "functionCall",
    "registrations.controller",
    "getRegistrations"
  );

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    if (options.double_mode) {
      return registrationDbDouble(options.double_mode);
    }

    const registrations = await getUnifiedRegistrations(
      options.before,
      options.after,
      ["establishment", "metadata"]
    );

    const formattedRegistrations = registrations.map((registration) => {
      return transformRegForCollections(registration);
    });
    transformEnumsForCollections(version, formattedRegistrations);
    logEmitter.emit(
      "functionSuccess",
      "registrations.controller",
      "getRegistrations"
    );
    return formattedRegistrations;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const updateRegistration = async (options) => {
  logEmitter.emit(
    "functionCall",
    "registrations.controller",
    "updateRegistration"
  );

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    if (options.double_mode) {
      return registrationDbDouble(options.double_mode);
    }

    const response = await updateRegistrationCollectedByCouncil(
      options.fsa_rn,
      options.collected,
      options.council
    );

    logEmitter.emit(
      "functionSuccess",
      "registrations.controller",
      "updateRegistration"
    );

    return response;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

module.exports = {
  getRegistrations,
  getRegistrationsByCouncil,
  getRegistration,
  updateRegistration
};
