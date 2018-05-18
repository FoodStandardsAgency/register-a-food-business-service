const { isEmail } = require("validator");
const ValidationError = require("../errors/ValidationError");

const createEstablishment = establishment => {
  // AUTHENTICATION

  // VALIDATION
  const errors = [];

  if (!isEmail(establishment.operator_email)) {
    errors.push({ key: "email", message: "Invalid email address" });
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  return "Establishment Created";
};

module.exports = { createEstablishment };
