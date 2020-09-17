"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_days_irregular",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_monday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_tuesday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_wednesday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_thursday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_friday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_saturday",
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_sunday",
        Sequelize.BOOLEAN
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_days_irregular"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_monday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_tuesday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_wednesday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_thursday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_friday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_saturday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_day_sunday"
      )
    ]);
  }
};
