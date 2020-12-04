"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_uprn",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_uprn",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_uprn"
      ),
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_uprn"
      )
    ]);
  }
};
