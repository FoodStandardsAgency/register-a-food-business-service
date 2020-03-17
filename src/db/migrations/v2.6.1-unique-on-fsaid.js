"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      return queryInterface.addIndex("registrations", ["fsa_rn"], {
        unique: true,
        name: "uqx_fsa_rn"
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      return queryInterface.removeIndex("registrations", "uqx_fsa_rn");
    });
  }
};
