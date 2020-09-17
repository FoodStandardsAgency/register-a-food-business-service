"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "customer_type",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "business_type",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "business_type_search_term",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "import_export_activities",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_trading_name",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_opening_date",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration1",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration2",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration3",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_type",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_company_house_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_charity_number",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_first_line",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_street",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_town",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_postcode",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_type",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "registrations", schema: "registrations" },
        "fsa_rn",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "customer_type"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "business_type"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "business_type_search_term"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "import_export_activities"
      ),
      queryInterface.removeColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_trading_name"
      ),
      queryInterface.removeColumn(
        { tableName: "establishments", schema: "registrations" },
        "establishment_opening_date"
      ),
      queryInterface.removeColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration1"
      ),
      queryInterface.removeColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration2"
      ),
      queryInterface.removeColumn(
        { tableName: "metadata", schema: "registrations" },
        "declaration3"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_type"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_company_house_number"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_charity_number"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_first_line"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_street"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_town"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_postcode"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_type"
      )
    ]);
  }
};
