"use strict";
module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      return queryInterface.addIndex("registrations", ["fsa_rn"], {
        unique: true,
        name: "uqx_fsa_rn",
        transaction
      });
    });
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      return queryInterface.removeIndex("registrations", "uqx_fsa_rn", {
        transaction
      });
    });
  }
};
