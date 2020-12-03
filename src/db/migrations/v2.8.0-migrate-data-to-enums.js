const {
  migratePgDataToEnums,
  migratePgDataFromEnums,
  migrateCosmosDataToEnums,
  migrateCosmosDataFromEnums
} = require("../../../scripts/migrate-data-to-enums");
const { logEmitter } = require("../../services/logging.service");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await migratePgDataToEnums(queryInterface, Sequelize);
    await migrateCosmosDataToEnums();
    logEmitter.emit("info", "Migration to enums complete");
  },
  down: async (queryInterface) => {
    await migrateCosmosDataFromEnums();
    await migratePgDataFromEnums(queryInterface);
    logEmitter.emit("info", "Migration from enums complete");
  }
};
