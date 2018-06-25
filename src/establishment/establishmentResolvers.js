const ValidationError = require("../errors/ValidationError");
const { validate } = require("../services/validation.service");

const createEstablishment = establishment => {
  // AUTHENTICATION

  // VALIDATION
  const errors = validate(establishment);
  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  return establishment;
};

module.exports = { createEstablishment };
