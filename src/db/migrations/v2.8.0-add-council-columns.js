"use strict";

const { syncCouncils } = require("../../../scripts/sync-council-table");

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
      },
      local_council_id: {
        type: Sequelize.INTEGER
      },
      local_council_phone_number: {
        type: Sequelize.STRING
      },
      local_council_email: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      separate_standards_council: {
        type: Sequelize.INTEGER
      },
      local_council_notify_emails: {
        type: Sequelize.JSONB
      },
      auth: {
        type: Sequelize.JSONB
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
      await queryInterface.createSchema("councils").then(async () => {
        await createNewCouncilsTable(
          queryInterface,
          Sequelize,
          "councils"
        ).then(async () => {
          await syncCouncils();
          await queryInterface
            .dropTable(
              {
                tableName: "councils",
                schema: "registrations"
              },
              { cascade: true }
            )
            .then(async () => {
              await createCouncilsForeignKey(queryInterface, "councils");
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
        schema: "councils"
      },
      { cascade: true }
    );
    await createCouncilsForeignKey(queryInterface, "registrations");
    await queryInterface.dropSchema("councils");
  }
};
