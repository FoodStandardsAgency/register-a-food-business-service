"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_monday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_tuesday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_wednesday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_thursday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_friday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_saturday",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_sunday",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_monday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_tuesday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_wednesday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_thursday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_friday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_saturday"
      ),
      queryInterface.removeColumn(
        { tableName: "activities", schema: "registrations" },
        "opening_hours_sunday"
      )
    ]);
  }
};
