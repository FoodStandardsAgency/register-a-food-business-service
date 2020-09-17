"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      { tableName: "activities", schema: "registrations" },
      "business_other_details",
      Sequelize.STRING
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      { tableName: "activities", schema: "registrations" },
      "business_other_details"
    );
  }
};
