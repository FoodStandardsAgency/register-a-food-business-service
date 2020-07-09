"use strict";

const { syncCouncils } = require("../../../scripts/sync-council-table");

const moveToCouncilsSchema = async (queryInterface) => {
  await queryInterface.createSchema("councils");
  // Move councils table to new schema
  queryInterface.sequelize.query(
    "UPDATE pg_catalog.pg_class SET relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'councils') WHERE relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'registrations') AND relname = 'councils';"
  );
  queryInterface.sequelize.query(
    "UPDATE pg_catalog.pg_type SET typnamespace  = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'councils') WHERE typnamespace  = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'registrations') AND typname = 'councils';"
  );
};

const revertMoveToCouncilsSchema = async (queryInterface) => {
  queryInterface.sequelize.query(
    "UPDATE pg_catalog.pg_class SET relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'registrations') WHERE relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'councils') AND relname = 'councils';"
  );
  queryInterface.sequelize.query(
    "UPDATE pg_catalog.pg_type SET typnamespace  = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'registrations') WHERE typnamespace  = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'councils') AND typname = 'councils';"
  );
  await queryInterface.dropSchema("councils");
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "local_council_id",
          {
            type: Sequelize.INTEGER
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "local_council_phone_number",
          {
            type: Sequelize.STRING
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "local_council_email",
          {
            type: Sequelize.STRING
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "country",
          {
            type: Sequelize.STRING
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "separate_standards_council",
          {
            type: Sequelize.INTEGER
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "local_council_notify_emails",
          {
            type: Sequelize.JSONB
          }
        );
        await queryInterface.addColumn(
          { tableName: "councils", schema: "registrations" },
          "auth",
          {
            type: Sequelize.JSONB
          }
        );
        await moveToCouncilsSchema(queryInterface)
        await syncCouncils(transaction);
    });
  },

  down: async (queryInterface) => {
    await revertMoveToCouncilsSchema(queryInterface);
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "local_council_id"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "local_council_phone_number"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "local_council_email"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "country"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "separate_standards_council"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "local_council_notify_emails"
    );
    await queryInterface.removeColumn(
      { tableName: "councils", schema: "registrations" },
      "auth"
    );
  }
};
