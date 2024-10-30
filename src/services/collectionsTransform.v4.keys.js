const establishment_keys = [
  "establishment_trading_name",
  "establishment_opening_date",
  "establishment_primary_number",
  "establishment_secondary_number",
  "establishment_web_address",
  "establishment_email"
];

const operator_keys = [
  "operator_type",
  "operator_company_name",
  "operator_charity_name",
  "operator_charity_number",
  "operator_first_name",
  "operator_last_name",
  "operator_birthdate",
  "operator_postcode",
  "operator_uprn",
  "operator_address_line_1",
  "operator_address_line_2",
  "operator_address_line_3",
  "operator_town",
  "operator_primary_number",
  "operator_secondary_number",
  "operator_email",
  "contact_representative_name",
  "contact_representative_role",
  "contact_representative_number",
  "contact_representative_email",
  "partners",
  "operator_company_house_number", // from Direct Registration
  "operator_companies_house_number" // from Front-end submission
];

const activities_keys = [
  "customer_type",
  "business_type",
  "business_type_search_term",
  "business_scale",
  "food_type",
  "processing_activities",
  "import_export_activities",
  "water_supply",
  "business_other_details",
  "opening_days_irregular",
  "opening_day_monday",
  "opening_day_tuesday",
  "opening_day_wednesday",
  "opening_day_thursday",
  "opening_day_friday",
  "opening_day_saturday",
  "opening_day_sunday",
  "opening_hours_monday",
  "opening_hours_tuesday",
  "opening_hours_wednesday",
  "opening_hours_thursday",
  "opening_hours_friday",
  "opening_hours_saturday",
  "opening_hours_sunday"
];

const premise_keys = [
  "establishment_address_line_1",
  "establishment_address_line_2",
  "establishment_address_line_3",
  "establishment_town",
  "establishment_postcode",
  "establishment_uprn",
  "establishment_type"
];

const versionSpecificTransforms = (establishment, operator, activities, premise) => {
  // No specific logic for V4
};

module.exports = {
  establishment_keys,
  operator_keys,
  activities_keys,
  premise_keys,
  versionSpecificTransforms
};
