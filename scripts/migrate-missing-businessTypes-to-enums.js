const { Activities, connectToDb } = require("../src/db/db");
const {
  getEstablishmentByRegId
} = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");
const {
  establishConnectionToCosmos
} = require("../src/connectors/cosmos.client");
const { BusinessTypesMapping } = require("./migrate-data-to-enums-data");

const applyPgBusinessTypeTransforms = async (registration, transform) => {
  logEmitter.emit("info", `Updating Temp-Store ID: ${registration.id}`);
  const establishment = await getEstablishmentByRegId(registration.id);

  if (!establishment) {
    logEmitter.emit("info", `No establishment found for ${registration.id}`);
    return;
  }

  await Activities.findOne({
    where: { establishmentId: establishment.id }
  }).then(async (record) => {
    if (!record) {
      logEmitter.emit("info", `No Activities found for ${registration.id}`);
    } else {
      await record
        .update({
          business_type: transform(BusinessTypesMapping, record.business_type)
        })
        .then(() => {
          logEmitter.emit("info", `Activities updated for ${registration.id}`);
        });
    }
  });
};

const applyCosmosBusinessTypeTransforms = async (
  registration,
  transform,
  newStatus
) => {
  logEmitter.emit(
    "info",
    `Updating BE Cache FSA-RN: ${registration["fsa-rn"]}`
  );
  try {
    await beCache.updateOne(
      { "fsa-rn": registration["fsa-rn"] },
      {
        $set: {
          "migration-2-8-1-enums-status": newStatus,
          "establishment.activities.business_type": transform(
            BusinessTypesMapping,
            registration.establishment.activities.business_type
          )
        }
      }
    );
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed to update BE Cache FSA-RN: ${registration["fsa-rn"]} ${err.message}`
    );
    await beCache.updateOne(
      { "fsa-rn": registration["fsa-rn"] },
      {
        $set: {
          "migration-2-8-1-enums-status": err.message
        }
      }
    );
  }
};

const transformToKey = (enumType, value) => {
  let transformedValue = value;
  Object.keys(enumType).forEach((enumKey) => {
    if (enumType[enumKey].value === value) {
      transformedValue = enumType[enumKey].key;
    }
  });
  return transformedValue;
};

const transformToValue = (enumType, key) => {
  if (enumType[key]) {
    return enumType[key].value;
  }
  return key;
};

const migratePgBusinessTypesToEnums = async (queryInterface, Sequelize) => {
  await connectToDb();

  // Creates table to store update statuses (if it doesn't already exist from previous migration attempt)
  await queryInterface
    .createTable(
      { tableName: "tmp281MigrationStatus", schema: "registrations" },
      {
        registrationId: {
          type: Sequelize.INTEGER,
          primaryKey: true
        },
        status: {
          type: Sequelize.STRING
        }
      }
    )
    .then(async () => {
      // Find registrations that haven't already been successfully updated
      await queryInterface.sequelize
        .query(
          `SELECT reg."id" FROM registrations."registrations" reg 
      LEFT JOIN registrations."tmp281MigrationStatus" status ON status."registrationId" = reg."id" 
      INNER JOIN registrations.establishments est ON reg."id" = est."registrationId" 
      INNER JOIN registrations.activities act ON est."id" = act."establishmentId"
      WHERE (status."registrationId" IS NULL OR status."status" <> 'true')
      AND act."business_type" IN ('Commercial bakery', 'Hostel or bed and breakfast ', 'Childcarer, nursery or play group')`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        )
        .then(async (regs) => {
          const promises = regs.map(async (reg) => {
            try {
              await applyPgBusinessTypeTransforms(reg, transformToKey).then(
                async () => {
                  await queryInterface.sequelize
                    .query(
                      `INSERT INTO registrations."tmp281MigrationStatus" ("registrationId", "status") values (${reg.id}, 'true')`
                    )
                    .then(() => {
                      logEmitter.emit(
                        "info",
                        `Successfully updated Temp-Store ID: ${reg.id}`
                      );
                    });
                }
              );
            } catch (err) {
              logEmitter.emit(
                "info",
                `Failed to update Temp-Store ID: ${reg.id} ${err.message}`
              );
              await queryInterface.sequelize.query(
                `INSERT INTO registrations."tmp281MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum migration: ${err.message}')`
              );
            }
          });
          await Promise.allSettled(promises);
        });
    });
};

const migratePgBusinessTypesFromEnums = async (queryInterface) => {
  await connectToDb();

  // Find registrations that haven't already been successfully updated
  await queryInterface.sequelize
    .query(
      `SELECT reg."id" FROM registrations."registrations" reg 
    INNER JOIN registrations."tmp281MigrationStatus" status ON status."registrationId" = reg."id" 
    INNER JOIN registrations.establishments est ON reg."id" = est."registrationId" 
    INNER JOIN registrations.activities act ON est."id" = act."establishmentId"
    WHERE act."business_type" IN ('021', '056', '064')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    .then(async (regs) => {
      const promises = regs.map(async (reg) => {
        try {
          await applyPgBusinessTypeTransforms(reg, transformToValue).then(
            async () => {
              await queryInterface.sequelize
                .query(
                  `DELETE FROM registrations."tmp281MigrationStatus" WHERE "registrationId"=${reg.id})`
                )
                .then(() => {
                  logEmitter.emit(
                    "info",
                    `Successfully updated Temp-Store ID: ${reg.id}`
                  );
                });
            }
          );
        } catch (err) {
          logEmitter.emit(
            "info",
            `Failed to update Temp-Store ID: ${reg.id} ${err.message}`
          );
          await queryInterface.sequelize.query(
            `INSERT INTO registrations."tmp281MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum un-migration: ${err.message}')`
          );
        }
      });
      await Promise.allSettled(promises);
    });
};

let beCache = undefined;
const migrateCosmosBusinessTypesToEnums = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  // Find documents that haven't already been successfully updated
  const registrations = await beCache
    .find({
      "migration-2-8-1-enums-status": { $ne: true },
      "establishment.activities.business_type": {
        $in: [
          "Commercial bakery",
          "Hostel or bed and breakfast ",
          "Childcarer, nursery or play group"
        ]
      }
    })
    .toArray();

  const promises = registrations.map(async (reg) => {
    await applyCosmosBusinessTypeTransforms(reg, transformToKey, true).then(
      () => {
        logEmitter.emit(
          "info",
          `Successfully updated BE Cache FSA-RN: ${reg["fsa-rn"]}`
        );
      }
    );
  });
  await Promise.allSettled(promises);
};

const migrateCosmosBusinessTypesFromEnums = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  // Find documents that have been updated
  const registrations = await beCache
    .find({ "migration-2-8-1-enums-status": true })
    .toArray();

  const promises = registrations.map(async (reg) => {
    await applyCosmosBusinessTypeTransforms(reg, transformToValue, false).then(
      () => {
        logEmitter.emit(
          "info",
          `Successfully updated BE Cache FSA-RN: ${reg["fsa-rn"]}`
        );
      }
    );
  });
  await Promise.allSettled(promises);
};

module.exports = {
  migratePgBusinessTypesToEnums,
  migratePgBusinessTypesFromEnums,
  migrateCosmosBusinessTypesToEnums,
  migrateCosmosBusinessTypesFromEnums
};
