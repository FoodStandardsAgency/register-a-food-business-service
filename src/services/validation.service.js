const { Validator } = require("jsonschema");
const { logEmitter } = require("./logging.service");
const schema = require("./validation.schema");

const errorMessages = {
  declaration1: "Invalid declaration1",
  declaration2: "Invalid declaration2",
  declaration3: "Invalid declaration3",
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
  establishment_primary_number: "Invalid operator primary number",
  establishment_secondary_number: "Invalid operator secondary number",
  establishment_email: "Invalid operator email",
  establishment_trading_name: "Invalid establishment trading name",
  establishment_opening_date: "Invalid establishment opening date",
  customer_type: "Invalid customer type",
  establishment_type: "Invalid establishment type",
  business_type: "Invalid business type",
  business_type_search_term: "Invalid business type search term",
  contact_representative_name: "Invalid representive name",
  contact_representative_number: "Invalid representative number",
  contact_representative_role: "Invalid representative role",
  contact_representative_email: "Invalid representative email",
  import_export_activities: "Invalid business activities",
  business_other_details: "Invalid business other details",
  opening_days_irregular: "Invalid opening days irregular",
  opening_day_monday: "Invalid opening day monday",
  opening_day_tuesday: "Invalid opening day tuesday",
  opening_day_wednesday: "Invalid opening day wednesday",
  opening_day_thurday: "Invalid opening day thursday",
  opening_day_friday: "Invalid opening day friday",
  opening_day_saturday: "Invalid opening day saturday",
  opening_day_sunday: "Invalid opening day sunday",
  partners: "Invalid partners",
  partner_is_primary_contact: "Invalid partner is primary contact",
  partner_name: "Invalid partner name",
  water_supply: "Invalid water supply"
};

const validator = new Validator();

// Set validation rules on validator
validator.attributes.validation = (instance, schema, options, ctx) => {
  const propertyPathArray = ctx.propertyPath.split(".");
  const propertyName = propertyPathArray.pop();
  if (instance !== undefined) {
    if (schema.validation(instance) === false) {
      return errorMessages[propertyName];
    }
  }
};

module.exports.validate = data => {
  logEmitter.emit("functionCall", "validation.service", "validate");
  const result = [];
  const validatorResult = validator.validate(data, schema.registration);
  // turn errors into key:value pairs
  validatorResult.errors.forEach(error => {
    result.push({ property: error.property, message: error.message });

    const newError = new Error(`${(error.property, error.message)}`);
    logEmitter.emit("functionFail", "validation.service", "validate", newError);
  });
  logEmitter.emit("functionSuccess", "validation.service", "validate");
  return result;
};
