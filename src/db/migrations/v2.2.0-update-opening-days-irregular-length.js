"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      { tableName: "activities", schema: "registrations" },
      "opening_days_irregular",
      {
        type: Sequelize.STRING(1500)
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      { tableName: "activities", schema: "registrations" },
      "opening_days_irregular",
      {
        type: Sequelize.STRING
      }
    );
  }
};
