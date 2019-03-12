"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "premises",
        "establishment_uprn",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn("operators", "operator_uprn", Sequelize.INTEGER)
    ]);
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("premises", "establishment_uprn"),
      queryInterface.removeColumn("operators", "operator_uprn")
    ]);
  }
};
