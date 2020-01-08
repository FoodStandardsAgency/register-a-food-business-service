"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "operators",
        "operator_address_line_1",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "operators",
        "operator_address_line_2",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "operators",
        "operator_address_line_3",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "premises",
        "establishments_address_line_1",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "premises",
        "establishments_address_line_2",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "premises",
        "establishments_address_line_3",
        Sequelize.STRING
      )
    ]);
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("operators", "operator_address_line_1"),
      queryInterface.removeColumn("operators", "operator_address_line_2"),
      queryInterface.removeColumn("operators", "operator_address_line_3"),
      queryInterface.removeColumn("premises", "establishments_address_line_1"),
      queryInterface.removeColumn("premises", "establishments_address_line_2"),
      queryInterface.removeColumn("premises", "establishments_address_line_3")
    ]);
  }
};
