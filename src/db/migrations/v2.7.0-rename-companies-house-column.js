"use strict";
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.renameColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_company_house_number",
        "operator_companies_house_number"
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.renameColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_companies_house_number",
        "operator_company_house_number"
      )
    ]);
  }
};
