const { info } = require("winston");
const ValidationError = require("../errors/ValidationError");
const { validate } = require("../services/validation.service");

const createEstablishment = establishment => {
  info(`establishmentResolver: createEstablishment: called`);
  // AUTHENTICATION

  // VALIDATION
  const errors = validate(establishment);
  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  info(`establishmentResolver: createEstablishment: finished`);
  return establishment;
};

module.exports = { createEstablishment };
