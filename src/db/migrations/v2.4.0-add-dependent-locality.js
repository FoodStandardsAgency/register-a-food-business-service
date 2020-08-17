"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_dependent_locality",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_dependent_locality",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "operators", schema: "registrations" },
        "operator_dependent_locality"
      ),
      queryInterface.removeColumn(
        { tableName: "premises", schema: "registrations" },
        "establishment_dependent_locality"
      )
    ]);
  }
};
