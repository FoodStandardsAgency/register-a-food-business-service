"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      "activities",
      "business_opening_days",
      Sequelize.STRING
    );
  },
  down: queryInterface => {
    return queryInterface.removeColumn("activities", "business_opening_days");
  }
};
