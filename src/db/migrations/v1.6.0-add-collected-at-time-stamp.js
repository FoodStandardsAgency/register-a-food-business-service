"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      { tableName: "registrations", schema: "registrations" },
      "collected_at",
      Sequelize.STRING
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      { tableName: "registrations", schema: "registrations" },
      "collected_at"
    );
  }
};
