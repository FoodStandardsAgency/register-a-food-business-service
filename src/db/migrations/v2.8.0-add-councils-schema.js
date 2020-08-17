"use strict";

const { populateCouncils } = require("../../../scripts/populate-council-table");

const councilsSchema = "councils";

const createNewCouncilsTable = async (
  queryInterface,
  Sequelize,
  councilSchema
) => {
  await queryInterface.createTable(
    { tableName: "councils", schema: councilSchema },
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
    {}
  );
};

const createCouncilsForeignKey = async (queryInterface, councilSchema) => {
  return queryInterface.addConstraint(
    { tableName: "registrations", schema: "registrations" },
    {
      fields: ["council"],
      type: "foreign key",
      name: "registrations_council_fkey",
      references: {
        table: { tableName: "councils", schema: councilSchema },
        field: "local_council_url"
      },
      onUpdate: "cascade",
      onDelete: "cascade"
    }
  );
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      await queryInterface.createSchema(councilsSchema).then(async () => {
        await createNewCouncilsTable(
          queryInterface,
          Sequelize,
          councilsSchema
        ).then(async () => {
          await populateCouncils();
          await queryInterface
            .dropTable(
              {
                tableName: "councils",
                schema: "registrations"
              },
              { cascade: true }
            )
            .then(async () => {
              await createCouncilsForeignKey(queryInterface, councilsSchema);
            });
        });
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await createNewCouncilsTable(queryInterface, Sequelize, "registrations");
    await queryInterface.dropTable(
      {
        tableName: "councils",
        schema: councilsSchema
      },
      { cascade: true }
    );
    await createCouncilsForeignKey(queryInterface, "registrations");
    await queryInterface.dropSchema(councilsSchema);
  }
};
