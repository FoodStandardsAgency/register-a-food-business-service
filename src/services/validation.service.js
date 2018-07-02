const { Validator } = require("jsonschema");
const schema = require("./validation.schema");

const errorMessages = {
  declaration1: "Invalid declaration1",
  declaration2: "Invalid declaration2",
  declaration3: "Invalid declaration3",
  registration_role: "Invalid registration role",
  operator_type: "Invalid operator type",
  operator_first_name: "Invalid operator first name",
  operator_last_name: "Invalid operator last name",
  operator_first_line: "Invalid establishment first line",
  operator_street: "Invalid street name",
  operator_town: "Invalid town name",
  operator_postcode: "Invalid establishment postcode",
  operator_primary_number: "Invalid operator primary number",
  operator_secondary_number: "Invalid operator secondary number",
  operator_email: "Invalid operator email",
  operator_company_name: "Invalid operator company name",
  operator_company_house_number: "Invalid operator Companies House number",
  operator_charity_name: "Invalid operator charity name",
  operator_charity_number: "Invalid operator charity number",
  establishment_first_line: "Invalid establishment first line",
  establishment_street: "Invalid street name",
  establishment_town: "Invalid town name",
  establishment_postcode: "Invalid establishment postcode",
  establishment_trading_name: "Invalid establishment trading name"
};

const validator = new Validator();

// Set validation rules on validator
validator.attributes.validation = (instance, schema, options, ctx) => {
  const propertyName = ctx.propertyPath.split(".")[1];

  if (instance !== undefined) {
    if (schema.validation(instance) === false) {
      return errorMessages[propertyName];
    }
  }
};

module.exports.validate = data => {
  const result = [];
  const validatorResult = validator.validate(data, schema.establishment);
  // turn errors into key:value pairs
  validatorResult.errors.forEach(error => {
    const key = error.property.split(".")[1];
    result.push({ key, message: error.message });
  });
  return result;
};
