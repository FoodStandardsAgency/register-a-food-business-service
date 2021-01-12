const { Validator } = require("jsonschema");
const { logEmitter } = require("./logging.service");
const schema = require("./validation.schema");
const directSubmissionSchema = require("./validation.directSubmission.schema");

const errorMessages = {
  declaration1: "Invalid declaration1",
  declaration2: "Invalid declaration2",
  declaration3: "Invalid declaration3",
  operator_type: "Invalid operator type",
  operator_first_name: "Invalid operator first name",
  operator_last_name: "Invalid operator last name",
  operator_town: "Invalid operator town name",
  operator_address_line_1: "Invalid operator first line of address",
  operator_address_line_2: "Invalid operator second line of address",
  operator_address_line_3: "Invalid operator third line of address",
  operator_postcode: "Invalid operator postcode",
  operator_uprn: "Invalid operator uprn",
  operator_primary_number: "Invalid operator primary number",
  operator_secondary_number: "Invalid operator secondary number",
  operator_email: "Invalid operator email",
  operator_company_name: "Invalid operator company name",
  operator_companies_house_number: "Invalid operator Companies House number",
  operator_charity_name: "Invalid operator charity, organisation or trust name",
  operator_charity_number: "Invalid operator charity number",
  establishment_address_line_1: "Invalid establishment first line of address",
  establishment_address_line_2: "Invalid establishment second line of address",
  establishment_address_line_3: "Invalid establishment third line of address",
  establishment_town: "Invalid establishment town name",
  establishment_postcode: "Invalid establishment postcode",
  establishment_uprn: "Invalid establishment uprn",
  establishment_primary_number: "Invalid establishment primary number",
  establishment_secondary_number: "Invalid establishment secondary number",
  establishment_email: "Invalid establishment email",
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
  opening_day_thursday: "Invalid opening day thursday",
  opening_day_friday: "Invalid opening day friday",
  opening_day_saturday: "Invalid opening day saturday",
  opening_day_sunday: "Invalid opening day sunday",
  partners: "Invalid partners",
  partner_is_primary_contact: "Invalid partner is primary contact",
  partner_name: "Invalid partner name",
  opening_hours_monday: "Invalid opening hours monday",
  opening_hours_tuesday: "Invalid opening hours tuesday",
  opening_hours_wednesday: "Invalid opening hours wednesday",
  opening_hours_thursday: "Invalid opening hours thursday",
  opening_hours_friday: "Invalid opening hours friday",
  opening_hours_saturday: "Invalid opening hours saturday",
  opening_hours_sunday: "Invalid opening hours sunday",
  water_supply: "Invalid water supply",
  fsa_rn: "Invalid FSA Reference Number"
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
  return undefined;
};

module.exports.validate = (data, isDirectSubmission = false) => {
  logEmitter.emit("functionCall", "validation.service", "validate");
  const result = [];

  var validationSchema = schema;
  if (isDirectSubmission) {
    logEmitter.emit("info", "Validating with direct submission schema");
    validationSchema = directSubmissionSchema;
  } else {
    logEmitter.emit("info", "Validating with standard schema");
  }

  const validatorResult = validator.validate(
    data,
    validationSchema.registration
  );

  // turn errors into key:value pairs
  validatorResult.errors.forEach((error) => {
    result.push({ property: error.property, message: error.message });

    const newError = new Error(`${(error.property, error.message)}`);
    logEmitter.emit("functionFail", "validation.service", "validate", newError);
  });

  logEmitter.emit("functionSuccess", "validation.service", "validate");
  return result;
};
