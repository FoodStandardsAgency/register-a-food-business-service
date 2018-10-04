"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      "activities",
      "business_irregular_days",
      Sequelize.STRING,
      "opening_days_monday",
      Sequelize.BOOLEAN,
      "opening_days_tuesday",
      Sequelize.BOOLEAN,
      "opening_days_wednesday",
      Sequelize.BOOLEAN,
      "opening_days_thursday",
      Sequelize.BOOLEAN,
      "opening_days_friday",
      Sequelize.BOOLEAN,
      "opening_days_saturday",
      Sequelize.BOOLEAN,
      "opening_days_sunday",
      Sequelize.BOOLEAN
    );
  },
  down: queryInterface => {
    return queryInterface.removeColumn("activities", "business_opening_days");
  }
};
