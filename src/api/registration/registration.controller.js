const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById
} = require("./registration.service");

const createNewRegistration = async registration => {
  // AUTHENTICATION

  // VALIDATION
  const errors = validate(registration);
  if (errors.length) {
    return errors;
  }

  // RESOLUTION
  const response = await saveRegistration(registration);

  return response;
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
