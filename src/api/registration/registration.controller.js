const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById,
  getRegistrationMetaData
} = require("./registration.service");

const createNewRegistration = async registration => {
  // AUTHENTICATION

  // VALIDATION
  if (registration === undefined) {
    throw new Error("registration is undefined");
  }
  const errors = validate(registration);
  if (errors.length) {
    throw new Error(JSON.stringify(errors));
  }

  // RESOLUTION

  const metaDataResponse = await getRegistrationMetaData();
  const response = await saveRegistration(registration);

  const combinedResponse = Object.assign(response, metaDataResponse);
  return combinedResponse;
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
