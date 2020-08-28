"use strict";
module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return queryInterface.addIndex(
        { tableName: "registrations", schema: "registrations" },
        ["fsa_rn"],
        {
          unique: true,
          name: "uqx_fsa_rn",
          transaction
        }
      );
    });
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return queryInterface.removeIndex(
        { tableName: "registrations", schema: "registrations" },
        "uqx_fsa_rn",
        {
          transaction
        }
      );
    });
  }
};
