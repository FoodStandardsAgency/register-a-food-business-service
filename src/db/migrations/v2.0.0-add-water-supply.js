"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "water_supply",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "water_supply"
      )
    ]);
  }
};
