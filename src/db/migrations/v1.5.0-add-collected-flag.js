"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      { tableName: "registrations", schema: "registrations" },
      "collected",
      Sequelize.BOOLEAN
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      { tableName: "registrations", schema: "registrations" },
      "collected"
    );
  }
};
