"use strict";
const addNewColumns = async (queryInterface, transaction) => {
  return (
    Promise.all([
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
    ]),
    { transaction }
  );
};

const copyData = async (queryInterface, transaction) => {
  return Promise.all([
    await queryInterface.sequelize.query(
      "UPDATE operators SET operator_address_line_1 = operator_first_line",
      "UPDATE operators SET operator_address_line_2 = operator_street",
      "UPDATE operators SET operator_address_line_3 = operator_dependant_locality",
      "UPDATE premises SET establishment_address_line_1 = establishment_first_line",
      "UPDATE premises SET establishment_address_line_2 = establishment_street",
      "UPDATE premises SET establishment_address_line_3 = establishment_dependant_locality",
      { transaction }
    )
  ]);
};

const removeOldColumns = async (queryInterface, transaction, Sequelize) => {
  return (
    queryInterface.removeColumn("operators", "operator_first_line"),
    queryInterface.removeColumn("operators", "operator_street"),
    queryInterface.removeColumn("operators", "operator_dependant_locality"),
    queryInterface.removeColumn("premises", "establishment_first_line"),
    queryInterface.removeColumn("premises", "establishment_street"),
    queryInterface.removeColumn("premises", "establishment_dependant_locality"),
    { transaction }
  );
};

const removeNewColumns = async (queryInterface, transaction) => {
  return (
    Promise.all([
      queryInterface.removeColumn("operators", "operator_address_line_1"),
      queryInterface.removeColumn("operators", "operator_address_line_2"),
      queryInterface.removeColumn("operators", "operator_address_line_3"),
      queryInterface.removeColumn("premises", "establishment_address_line_1"),
      queryInterface.removeColumn("premises", "establishment_address_line_2"),
      queryInterface.removeColumn("premises", "establishment_address_line_3")
    ]),
    { transaction }
  );
};

const recopyData = async (queryInterface, transaction) => {
  return Promise.all([
    await queryInterface.sequelize.query(
      "UPDATE operators SET operator_first_line = operator_address_line_1",
      "UPDATE operators SET operator_street = operator_address_line_2",
      "UPDATE operators SET operator_dependant_locality = operator_address_line_3",
      "UPDATE premises SET establishment_first_line = establishment_address_line_1",
      "UPDATE premises SET establishment_street = establishment_address_line_2",
      "UPDATE premises SET establishment_dependant_locality = establishment_address_line_3",
      { transaction }
    )
  ]);
};
const addOldColumns = async (queryInterface, transaction, Sequelize) => {
  return (
    Promise.all([
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
    ]),
    { transaction }
  );
};

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.transaction(async transaction => {
        addNewColumns(queryInterface, transaction);
        copyData(queryInterface, transaction);
        removeOldColumns(queryInterface, transaction);
      })
    ]);
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.transaction(async transaction => {
        addOldColumns(queryInterface, transaction);
        recopyData(queryInterface, transaction);
        removeNewColumns(queryInterface, transaction);
      })
    ]);
  }
};
