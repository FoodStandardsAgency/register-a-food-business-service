const { validate } = require("../../services/validation.service");
const { saveRegistration } = require("./registration.service");

const createNewRegistration = async registration => {
  // AUTHENTICATION

  // VALIDATION
  const errors = validate(registration);
  if (errors.length) {
    return errors;
  }

  // RESOLUTION
  const response = saveRegistration(registration);

  // const filteredRegistration = personalInfoFilter(registration);
  // const id = uuidv4();
  // const response = await Establishment.create(
  //   Object.assign(filteredRegistration, { id })
  // );
  return response;
};

module.exports = { createNewRegistration };
