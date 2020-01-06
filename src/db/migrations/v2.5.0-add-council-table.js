"use strict";

const createCouncil = (queryInterface, Sequelize) =>
  queryInterface.createTable("councils", {
    createdAt: {
      type: Sequelize.DATE
    },
    updatedAt: {
      type: Sequelize.DATE
    },
    local_council_url: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    local_council_full_name: {
      type: Sequelize.STRING
    },
    competent_authority_id: {
      type: Sequelize.STRING
    }
  });

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([createCouncil(queryInterface, Sequelize)]);
  },
  down: queryInterface => {
    return Promise.all([queryInterface.dropTable("councils")]);
  }
};
