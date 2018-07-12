const {
  validateDeclaration,
  validatePostCode,
  validateFirstLine,
  validateOptionalString,
  validateName,
  validateTown,
  validateEstablishmentTradingName,
  validatePhoneNumber,
  validatePhoneNumberOptional,
  validateEmail,
  validateRadioButtons,
  validateCompanyName,
  validateCompaniesHouseNumber,
  validateCharityName,
  validateCharityNumber,
  validateCustomerType
} = require("@slice-and-dice/register-a-food-business-validation");

const schema = {
  establishment: {
    type: "object",
    properties: {
      operator_type: {
        type: "string",
        validation: validateRadioButtons
      },
      operator_first_name: {
        type: "string",
        validation: validateName
      },
      operator_last_name: {
        type: "string",
        validation: validateName
      },
      operator_postcode: {
        type: "string",
        validation: validatePostCode
      },
      operator_first_line: {
        type: "string",
        validation: validateFirstLine
      },
      operator_street: {
        type: "string",
        validation: validateOptionalString
      },
      operator_town: {
        type: "string",
        validation: validateTown
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
      operator_company_name: {
        type: "string",
        validation: validateCompanyName
      },
      operator_company_house_number: {
        type: "string",
        validation: validateCompaniesHouseNumber
      },
      operator_charity_name: {
        type: "string",
        validation: validateCharityName
      },
      operator_charity_number: {
        type: "string",
        validation: validateCharityNumber
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
        validation: validateFirstLine
      },
      establishment_street: {
        type: "string",
        validation: validateOptionalString
      },
      establishment_town: {
        type: "string",
        validation: validateTown
      },
      establishment_primary_number: {
        type: "string",
        validation: validatePhoneNumber
      },
      establishment_secondary_number: {
        type: "string",
        validation: validatePhoneNumberOptional
      },
      establishment_email: {
        type: "string",
        validation: validateEmail
      },
      contact_representative_name: {
        type: "string",
        validation: validateName
      },
      contact_representative_number: {
        type: "string",
        validation: validatePhoneNumber
      },
      contact_representative_role: {
        type: "string",
        validation: validateOptionalString
      },
      contact_representative_email: {
        type: "string",
        validation: validateEmail
      },
      establishment_email: {
        type: "string",
        validation: validateEmail
      },
      customer_type: {
        type: "string",
        validation: validateCustomerType
      },
      declaration1: { type: "string", validation: validateDeclaration },
      declaration2: { type: "string", validation: validateDeclaration },
      declaration3: { type: "string", validation: validateDeclaration }
    },
    required: [
      "operator_type",
      "operator_primary_number",
      "operator_postcode",
      "operator_first_line",
      "operator_email",
      "establishment_trading_name",
      "establishment_postcode",
      "establishment_first_line",
      "establishment_primary_number",
      "establishment_email",
      "contact_representative_number",
      "contact_representative_name",
      "contact_representative_email",
      "customer_type",
      "declaration1",
      "declaration2",
      "declaration3"
    ],
    oneOf: [
      { required: ["operator_company_name", "operator_company_house_number"] },
      { required: ["operator_charity_name"] },
      { required: ["operator_first_name", "operator_last_name"] },
      { required: ["operator_primary_number", "operator_email"] },
      { required: ["contact_representative_number", "contact_representative_name", "contact_representative_role"] }
    ]
  }
};

module.exports = schema;
