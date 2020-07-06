"use strict";

const { syncCouncils } = require("../../../scripts/sync-council-table");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("councils", "local_council_id", {
        type: Sequelize.INTEGER
      });
      await queryInterface.addColumn("councils", "local_council_phone_number", {
        type: Sequelize.STRING
      });
      await queryInterface.addColumn("councils", "local_council_email", {
        type: Sequelize.STRING
      });
      await queryInterface.addColumn("councils", "country", {
        type: Sequelize.STRING
      });
      await queryInterface.addColumn("councils", "separate_standards_council", {
        type: Sequelize.INTEGER
      });
      await queryInterface.addColumn(
        "councils",
        "local_council_notify_emails",
        {
          type: Sequelize.JSONB
        }
      );
      await queryInterface.addColumn("councils", "auth", {
        type: Sequelize.JSONB
      });
      await syncCouncils(transaction);
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("councils", "local_council_id");
      await queryInterface.removeColumn(
        "councils",
        "local_council_phone_number"
      );
      await queryInterface.removeColumn("councils", "local_council_email");
      await queryInterface.removeColumn("councils", "country");
      await queryInterface.removeColumn(
        "councils",
        "separate_standards_council"
      );
      await queryInterface.removeColumn(
        "councils",
        "local_council_notify_emails"
      );
      await queryInterface.removeColumn("councils", "auth");
    });
  }
};
