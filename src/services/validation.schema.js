const {
  validateDeclaration,
  validatePostCode,
  validateEstablishmentFirstLine,
  validateStreet,
  validateName,
  validateTown,
  validateEstablishmentTradingName,
  validatePhoneNumber,
  validatePhoneNumberOptional,
  validateEmail,
  validateOperatorType
} = require("@slice-and-dice/register-a-food-business-validation");

const schema = {
  establishment: {
    type: "object",
    properties: {
      operator_type: {
        type: "string",
        validation: validateOperatorType
      },
      operator_first_name: {
        type: "string",
        validation: validateName
      },
      operator_last_name: {
        type: "string",
        validation: validateName
      },
      operator_primary_number: {
        type: "string",
        validation: validatePhoneNumber
      },
      operator_secondary_number: {
        type: "string",
        validation: validatePhoneNumberOptional
      },
      operator_email: {
        type: "string",
        validation: validateEmail
      },
      establishment_trading_name: {
        type: "string",
        validation: validateEstablishmentTradingName
      },
      establishment_postcode: {
        type: "string",
        validation: validatePostCode
      },
      establishment_first_line: {
        type: "string",
        validation: validateEstablishmentFirstLine
      },
      establishment_street: {
        type: "string",
        validation: validateStreet
      },
      establishment_town: {
        type: "string",
        validation: validateTown
      },
      declaration1: { type: "string", validation: validateDeclaration },
      declaration2: { type: "string", validation: validateDeclaration },
      declaration3: { type: "string", validation: validateDeclaration }
    }
  }
};

module.exports = schema;
