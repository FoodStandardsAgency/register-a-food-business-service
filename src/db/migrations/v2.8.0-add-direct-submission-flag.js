"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        { tableName: "registrations", schema: "registrations" },
        "direct_submission",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(
        { tableName: "registrations", schema: "registrations" },
        "direct_submission"
      )
    ]);
  }
};
