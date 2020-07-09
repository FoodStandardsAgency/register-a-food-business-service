"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "metadata", schema: "registrations" },
        "feedback1",
        Sequelize.STRING
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "metadata", schema: "registrations" },
        "feedback1"
      )
    ]);
  }
};
