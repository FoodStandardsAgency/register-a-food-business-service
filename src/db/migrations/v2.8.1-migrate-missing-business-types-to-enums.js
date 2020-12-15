const {
  migratePgBusinessTypesToEnums,
  migratePgBusinessTypesFromEnums,
  migrateCosmosBusinessTypesToEnums,
  migrateCosmosBusinessTypesFromEnums
} = require("../../../scripts/migrate-missing-businessTypes-to-enums");
const { logEmitter } = require("../../services/logging.service");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await migratePgBusinessTypesToEnums(queryInterface, Sequelize);
    await migrateCosmosBusinessTypesToEnums();
    logEmitter.emit("info", "Migration to enums complete");
  },
  down: async (queryInterface) => {
    await migrateCosmosBusinessTypesFromEnums();
    await migratePgBusinessTypesFromEnums(queryInterface);
    logEmitter.emit("info", "Migration from enums complete");
  }
};
