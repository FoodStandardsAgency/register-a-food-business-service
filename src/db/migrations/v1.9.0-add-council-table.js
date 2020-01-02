"use strict";

const createCouncil = (queryInterface, Sequelize) =>
  queryInterface.createTable("council", {
    createdAt: {
      type: Sequelize.DATE
    },
    updatedAt: {
      type: Sequelize.DATE
    },
    local_council_url: {
      type: Sequelize.STRING
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
    return Promise.all([queryInterface.dropTable("council")]);
  }
};
