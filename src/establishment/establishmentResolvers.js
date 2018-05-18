const { isEmail } = require("validator");

const createEstablishment = establishment => {
  // AUTEHNTICATION

  // VALIDATION
  if (!isEmail(establishment.operator_email)) {
    throw new Error("Invalid email address");
  }

  // RESOLUTION
  return "Establishment Created";
};

module.exports = { createEstablishment };
