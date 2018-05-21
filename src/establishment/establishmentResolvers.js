const { isEmail } = require("validator");
const ValidationError = require("../errors/ValidationError");

const createEstablishment = establishment => {
  // AUTHENTICATION

  // VALIDATION
  const errors = [];

  if (establishment.operator_email && !isEmail(establishment.operator_email)) {
    errors.push({ key: "email", message: "Invalid email address" });
  }

  if (Array.isArray(establishment.operator_mobile_numbers)) {
    establishment.operator_mobile_numbers.forEach(number => {
      if (number.length > 11) {
        errors.push({
          key: "operator_mobile_numbers",
          message: "Invalid phone number"
        });
      }
    });
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  return "Establishment Created";
};

module.exports = { createEstablishment };
