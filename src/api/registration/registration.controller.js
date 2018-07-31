const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById
} = require("./registration.service");
const moment = require("moment");

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

  const reg_submission_date = moment().format("YYYY MM DD");
  const response = await saveRegistration(registration);

  const combinedResponse = Object.assign(response, { reg_submission_date });
  return combinedResponse;
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
