const { isEmail, isPostalCode, isAscii, isEmpty } = require("validator");
const ValidationError = require("../errors/ValidationError");

const createEstablishment = establishment => {
  // AUTHENTICATION

  // VALIDATION
  const errors = [];

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

  if (establishment.declaration1 === "") {
    errors.push({
      key: "declaration1",
      message: "Invalid declaration1"
    });
  }

  if (establishment.declaration2 === "") {
    errors.push({
      key: "declaration2",
      message: "Invalid declaration2"
    });
  }

  if (establishment.declaration3 === "") {
    errors.push({
      key: "declaration3",
      message: "Invalid declaration3"
    });
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }

  // RESOLUTION
  return establishment;
};

module.exports = { createEstablishment };
