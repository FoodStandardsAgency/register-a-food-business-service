const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration
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

  const tascomiResponse = await sendTascomiRegistration(registration);
  const response = await saveRegistration(registration);

  return { response, tascomiResponse };
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
