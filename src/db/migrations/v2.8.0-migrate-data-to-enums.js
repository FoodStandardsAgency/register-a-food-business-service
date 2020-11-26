const {
  migratePgDataToEnums,
  migratePgDataFromEnums,
  migrateCosmosDataToEnums,
  migrateCosmosDataFromEnums
} = require("../../../scripts/migrate-data-to-enums");
const { logEmitter } = require("../../services/logging.service");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const promises = [];
    promises.push(migratePgDataToEnums(queryInterface, Sequelize));
    promises.push(migrateCosmosDataToEnums());
    await Promise.allSettled(promises);

    logEmitter.emit("info", "Migration to enums complete");
  },
  down: async (queryInterface) => {
    const promises = [];
    promises.push(migrateCosmosDataFromEnums());
    promises.push(migratePgDataFromEnums(queryInterface));
    await Promise.allSettled(promises);

    logEmitter.emit("info", "Migration from enums complete");
  }
};
