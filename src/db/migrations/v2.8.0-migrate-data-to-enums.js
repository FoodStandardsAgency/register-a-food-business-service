const {
  migratePgDataToEnums,
  migrateCosmosDataToEnums
} = require("../../../scripts/migrate-data-to-enums");

module.exports = {
  up: async () => {
    await migratePgDataToEnums(true);
    await migrateCosmosDataToEnums(true);
  },
  down: async () => {
    await migrateCosmosDataToEnums(false);
    await migratePgDataToEnums(false);
  }
};
