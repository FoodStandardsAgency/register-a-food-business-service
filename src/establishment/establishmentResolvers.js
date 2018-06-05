const { isEmail, isPostalCode, isAscii } = require("validator");
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

  if (
    establishment.establishment_first_line &&
    !isAscii(establishment.establishment_first_line)
  ) {
    errors.push({
      key: "establishment_first_line",
      message: "Invalid establishment first line"
    });
  }

  if (
    establishment.establishment_postcode &&
    !isPostalCode(establishment.establishment_postcode, "GB")
  ) {
    errors.push({
      key: "establishment_postcode",
      message: "Invalid establishment postcode"
    });
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  return establishment;
};

module.exports = { createEstablishment };
