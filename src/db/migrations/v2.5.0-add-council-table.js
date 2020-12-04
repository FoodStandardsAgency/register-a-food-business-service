"use strict";

const { populateCouncils } = require("../../../scripts/populate-council-table");

const createCouncil = async (queryInterface, Sequelize, transaction) => {
  queryInterface.createTable(
    { tableName: "councils", schema: "registrations" },
    {
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      local_council_url: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      local_council_full_name: {
        type: Sequelize.STRING
      },
      competent_authority_id: {
        type: Sequelize.INTEGER
      }
    },
    { transaction: transaction }
  );
};

const createCouncilsForeignKey = async (queryInterface, transaction) => {
  return queryInterface.addConstraint(
    { tableName: "registrations", schema: "registrations" },
    ["council"],
    {
      type: "foreign key",
      name: "registrations_council_fkey",
      references: {
        table: { tableName: "councils", schema: "registrations" },
        field: "local_council_url"
      },
      onUpdate: "cascade",
      onDelete: "cascade",
      transaction: transaction
    }
  );
};

const dropCouncilsForeignKey = async (queryInterface, transaction) => {
  return queryInterface.removeConstraint(
    { tableName: "registrations", schema: "registrations" },
    "registrations_council_fkey",
    { transaction: transaction }
  );
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await createCouncil(queryInterface, Sequelize, transaction);
      await populateCouncils(transaction);
      return createCouncilsForeignKey(queryInterface, transaction);
    });
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await dropCouncilsForeignKey(queryInterface, transaction);
      return queryInterface.dropTable(
        { tableName: "councils", schema: "registrations" },
        { transaction: transaction }
      );
    });
  }
};
