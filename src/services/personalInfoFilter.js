const personalInfo = [
  "operator_first_name",
  "operator_last_name",
  "operator_first_line",
  "operator_street",
  "operator_town",
  "operator_postcode",
  "operator_primary_number",
  "operator_secondary_number",
  "operator_email",
  "operator_company_name",
  "operator_charity_name",
  "establishment_primary_number",
  "establishment_secondary_number",
  "establishment_email",
  "business_other_details"
];

const personalInfoFilter = info => {
  const filteredInfo = Object.assign({}, info);

  personalInfo.forEach(key => {
    delete filteredInfo[key];
  });

  return filteredInfo;
};

module.exports = { personalInfoFilter };
