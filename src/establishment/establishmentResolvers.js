const { info, error } = require("winston");
const ValidationError = require("../errors/ValidationError");
const { validate } = require("../services/validation.service");
const { Establishment } = require("../db/db");

const createEstablishment = async establishment => {
  info(`establishmentResolver: createEstablishment: called`);
  // AUTHENTICATION

  // VALIDATION
  const errors = validate(establishment);
  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  try {
    const response = await Establishment.create(establishment);
    info(`establishmentResolver: createEstablishment: finished`);
    return response;
  } catch (err) {
    error(`establishmentResolver: createEstablishment: error: ${err}`);
  }
};

module.exports = { createEstablishment };
