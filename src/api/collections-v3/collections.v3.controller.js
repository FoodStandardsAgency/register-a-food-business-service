const {
  getSingleRegistration,
  getAllRegistrationsByCouncils,
  getUnifiedRegistrations,
  updateRegistrationCollectedByCouncil
} = require("../../connectors/registrationsDb/registrationsDb.connector");

const { validateOptions } = require("../collections/collections.service");
const { transformRegForCollections } = require("../../services/collectionsTransform.service");

const { logEmitter } = require("../../services/logging.service");
const { getCouncilsForSupplier } = require("../../connectors/configDb/configDb.connector");

const apiVersion = "v3";

const getRegistrationsByCouncil = async (options) => {
  logEmitter.emit("functionCall", "collections.v3.controller", "getRegistrationsByCouncil");

  const validationResult = await validateOptions(options, true);

  if (validationResult === true) {
    /*Check if single requested LA is the same as subscriber. This means it's either an LA requesting
    their own registrations or a non-LA subscriber not defining which councils they want returned.
    In the latter case all authorised registrations should be returned by default.*/
    if (
      options.requestedCouncils.length === 1 &&
      options.requestedCouncils[0] === options.subscriber
    ) {
      const validCouncils = await getCouncilsForSupplier(options.subscriber);
      // validCouncils will return empty array if LA subscriber.
      if (validCouncils.length > 0) {
        options.requestedCouncils = validCouncils;
      }
    }

    const registrations = await getAllRegistrationsByCouncils(
      options.requestedCouncils,
      options.new,
      options.fields,
      options.before,
      options.after
    );

    const formattedRegistrations = registrations.map((registration) => {
      return transformRegForCollections(registration, apiVersion);
    });
    logEmitter.emit("functionSuccess", "collections.v3.controller", "getRegistrationsByCouncil");

    return formattedRegistrations;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const getRegistration = async (options) => {
  logEmitter.emit("functionCall", "collections.v3.controller", "getRegistration");

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    const registration = await getSingleRegistration(options.fsa_rn, options.requestedCouncil);

    const formattedRegistration = transformRegForCollections(registration, apiVersion);

    logEmitter.emit("functionSuccess", "collections.v3.controller", "getRegistration");
    return formattedRegistration;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const getRegistrations = async (options) => {
  logEmitter.emit("functionCall", "collections.v3.controller", "getRegistrations");

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    const registrations = await getUnifiedRegistrations(options.before, options.after, [
      "establishment",
      "metadata"
    ]);

    const formattedRegistrations = registrations.map((registration) => {
      return transformRegForCollections(registration, apiVersion);
    });
    logEmitter.emit("functionSuccess", "collections.v3.controller", "getRegistrations");
    return formattedRegistrations;
  } else {
    const error = new Error("");
    error.name = "optionsValidationError";
    error.rawError = validationResult;
    throw error;
  }
};

const updateRegistration = async (options) => {
  logEmitter.emit("functionCall", "collections.v3.controller", "updateRegistration");

  const validationResult = await validateOptions(options);

  if (validationResult === true) {
    const response = await updateRegistrationCollectedByCouncil(
      options.fsa_rn,
      options.collected,
      options.requestedCouncil
    );

    logEmitter.emit("functionSuccess", "collections.v3.controller", "updateRegistration");

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
