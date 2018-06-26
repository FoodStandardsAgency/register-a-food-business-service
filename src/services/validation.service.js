const { Validator } = require("jsonschema");
const schema = require("./validation.schema");

const errorMessages = {
  declaration1: "Invalid declaration1",
  declaration2: "Invalid declaration2",
  declaration3: "Invalid declaration3",
  operator_type: "Invalid operator type",
  operator_first_name: "Invalid operator first name",
  operator_last_name: "Invalid operator last name",
  operator_primary_number: "Invalid operator primary number",
  operator_secondary_number: "Invalid operator secondary number",
  operator_email: "Invalid operator email",
  establishment_first_line: "Invalid establishment first line",
  establishment_street: "Invalid street name",
  establishment_town: "Invalid town name",
  establishment_postcode: "Invalid establishment postcode",
  establishment_trading_name: "Invalid establishment trading name"
};

const validator = new Validator();

// Set validation rules on validator
validator.attributes.validation = (instance, schema, options, ctx) => {
  if (schema.validation(instance) === false) {
    return errorMessages[ctx.propertyPath.split(".")[1]];
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
