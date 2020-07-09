"use strict";
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.renameTable(
        { tableName: "metadata", schema: "registrations" },
        "declarations"
      )
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.renameTable(
        { tableName: "declarations", schema: "registrations" },
        "metadata"
      )
    ]);
  }
};
