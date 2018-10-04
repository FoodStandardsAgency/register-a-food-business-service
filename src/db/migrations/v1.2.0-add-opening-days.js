"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        "activities",
        "business_irregular_days",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_monday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_tuesday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_wednesday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_thursday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_friday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_saturday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        "activities",
        "opening_days_sunday",
        Sequelize.BOOLEAN
      )
    ];
  },
  down: queryInterface => {
    return [
      queryInterface.removeColumn("activities", "business_irregular_days"),
      queryInterface.removeColumn("activities", "opening_days_monday"),
      queryInterface.removeColumn("activities", "opening_days_tuesday"),
      queryInterface.removeColumn("activities", "opening_days_wednesday"),
      queryInterface.removeColumn("activities", "opening_days_thursday"),
      queryInterface.removeColumn("activities", "opening_days_friday"),
      queryInterface.removeColumn("activities", "opening_days_saturday"),
      queryInterface.removeColumn("activities", "opening_days_sunday")
    ];
  }
};
