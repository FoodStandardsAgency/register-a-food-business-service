"use strict";
const addNewColumns = async (queryInterface, Sequelize, transaction) => {
  return Promise.all([
    queryInterface.addColumn(
      "operators",
      "operator_address_line_1",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "operators",
      "operator_address_line_2",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "operators",
      "operator_address_line_3",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_address_line_1",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_address_line_2",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_address_line_3",
      Sequelize.STRING,
      { transaction: transaction }
    )
  ]);
};

const copyData = async (queryInterface, transaction) => {
  return Promise.all([
    queryInterface.sequelize.query(
      "UPDATE operators " +
        "SET operator_address_line_1 = operator_first_line, " +
        "operator_address_line_2 = operator_street, " +
        "operator_address_line_3 = operator_dependent_locality",
      { transaction: transaction }
    ),
    queryInterface.sequelize.query(
      "UPDATE premises " +
        "SET establishment_address_line_1 = establishment_first_line, " +
        "establishment_address_line_2 = establishment_street, " +
        "establishment_address_line_3 = establishment_dependent_locality",
      { transaction: transaction }
    )
  ]);
};

const removeOldColumns = async (queryInterface, transaction) => {
  return Promise.all([
    queryInterface.removeColumn("operators", "operator_first_line", {
      transaction: transaction
    }),
    queryInterface.removeColumn("operators", "operator_street", {
      transaction: transaction
    }),
    queryInterface.removeColumn("operators", "operator_dependent_locality", {
      transaction: transaction
    }),
    queryInterface.removeColumn("premises", "establishment_first_line", {
      transaction: transaction
    }),
    queryInterface.removeColumn("premises", "establishment_street", {
      transaction: transaction
    }),
    queryInterface.removeColumn(
      "premises",
      "establishment_dependent_locality",
      { transaction: transaction }
    )
  ]);
};

const removeNewColumns = async (queryInterface, transaction) => {
  return Promise.all([
    queryInterface.removeColumn("operators", "operator_address_line_1", {
      transaction: transaction
    }),
    queryInterface.removeColumn("operators", "operator_address_line_2", {
      transaction: transaction
    }),
    queryInterface.removeColumn("operators", "operator_address_line_3", {
      transaction: transaction
    }),
    queryInterface.removeColumn("premises", "establishment_address_line_1", {
      transaction: transaction
    }),
    queryInterface.removeColumn("premises", "establishment_address_line_2", {
      transaction: transaction
    }),
    queryInterface.removeColumn("premises", "establishment_address_line_3", {
      transaction: transaction
    })
  ]);
};

const recopyData = async (queryInterface, transaction) => {
  return Promise.all([
    queryInterface.sequelize.query(
      "UPDATE operators SET operator_first_line = operator_address_line_1, " +
        "operator_street = operator_address_line_2, " +
        "operator_dependent_locality = operator_address_line_3",
      { transaction: transaction }
    ),
    queryInterface.sequelize.query(
      "UPDATE premises SET establishment_first_line = establishment_address_line_1, " +
        "establishment_street = establishment_address_line_2, " +
        "establishment_dependent_locality = establishment_address_line_3",
      { transaction: transaction }
    )
  ]);
};
const addOldColumns = async (queryInterface, Sequelize, transaction) => {
  return Promise.all([
    queryInterface.addColumn(
      "operators",
      "operator_first_line",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn("operators", "operator_street", Sequelize.STRING, {
      transaction: transaction
    }),
    queryInterface.addColumn(
      "operators",
      "operator_dependent_locality",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_first_line",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_street",
      Sequelize.STRING,
      { transaction: transaction }
    ),
    queryInterface.addColumn(
      "premises",
      "establishment_dependent_locality",
      Sequelize.STRING,
      { transaction: transaction }
    )
  ]);
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await addNewColumns(queryInterface, Sequelize, transaction);
      await copyData(queryInterface, transaction);
      return removeOldColumns(queryInterface, transaction);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await addOldColumns(queryInterface, Sequelize, transaction);
      await recopyData(queryInterface, transaction);
      return removeNewColumns(queryInterface, transaction);
    });
  }
};
