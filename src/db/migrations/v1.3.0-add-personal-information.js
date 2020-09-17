"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_primary_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_secondary_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_email",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_company_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_charity_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_first_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_last_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_postcode",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_first_line",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_street",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_town",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_primary_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_secondary_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_email",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_role",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_email",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_primary_number"
      ),
      queryInterface.removeColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_secondary_number"
      ),
      queryInterface.removeColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_email"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_company_name"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_charity_name"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_first_name"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_last_name"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_postcode"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_first_line"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_street"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_town"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_primary_number"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_secondary_number"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_email"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_name"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_role"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_number"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "contact_representative_email"
      )
    ]);
  }
};
