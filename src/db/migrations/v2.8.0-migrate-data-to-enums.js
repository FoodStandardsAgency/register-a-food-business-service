const {
  migratePgDataToEnums,
  migratePgDataFromEnums,
  migrateCosmosDataToEnums,
  migrateCosmosDataFromEnums
} = require("../../../scripts/migrate-data-to-enums");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await migratePgDataToEnums(queryInterface, Sequelize);
    await migrateCosmosDataToEnums();
  },
  down: async (queryInterface) => {
    await migrateCosmosDataFromEnums();
    await migratePgDataFromEnums(queryInterface);
  }
};
