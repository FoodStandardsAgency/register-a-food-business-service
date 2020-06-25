"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("councils", "local_council_id", {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn("councils", "local_council_phone_number", {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn("councils", "country", {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn("councils", "separate_standards_council", {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn("councils", "local_council_notify_emails", {
      type: Sequelize.JSONB
    });
    await queryInterface.addColumn("councils", "auth", {
      type: Sequelize.JSONB
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("councils", "local_council_id");
    await queryInterface.removeColumn("councils", "local_council_phone_number");
    await queryInterface.removeColumn("councils", "country");
    await queryInterface.removeColumn("councils", "separate_standards_council");
    await queryInterface.removeColumn(
      "councils",
      "local_council_notify_emails"
    );
    await queryInterface.removeColumn("councils", "auth");
  }
};
