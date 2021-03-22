const { Operator, Activities, Premise, connectToDb } = require("../src/db/db");
const {
  getEstablishmentByRegId
} = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");
const {
  establishConnectionToCosmos
} = require("../src/connectors/cosmos.client");
const {
  BusinessTypesMapping,
  OperatorTypeMapping,
  EstablishmentTypeMapping,
  CustomerTypeMapping,
  WaterSupplyMapping,
  ImportExportActivitiesMapping
} = require("./migrate-data-to-enums-data");

const applyPgTransforms = async (registration, transform) => {
  logEmitter.emit("info", `Updating Temp-Store ID: ${registration.id}`);
  const establishment = await getEstablishmentByRegId(registration.id);

  if (!establishment) {
    logEmitter.emit("info", `No establishment found for ${registration.id}`);
    return;
  }

  await Operator.findOne({ where: { establishmentId: establishment.id } }).then(
    async (record) => {
      if (!record) {
        logEmitter.emit("info", `No Operator found for ${registration.id}`);
      } else {
        await record
          .update({
            operator_type: transform(OperatorTypeMapping, record.operator_type)
          })
          .then(() => {
            logEmitter.emit("info", `Operator updated for ${registration.id}`);
          });
      }
    }
  );

  await Premise.findOne({ where: { establishmentId: establishment.id } }).then(
    async (record) => {
      if (!record) {
        logEmitter.emit("info", `No Premise found for ${registration.id}`);
      } else {
        await record
          .update({
            establishment_type: transform(
              EstablishmentTypeMapping,
              record.establishment_type
            )
          })
          .then(() => {
            logEmitter.emit("info", `Premise updated for ${registration.id}`);
          });
      }
    }
  );

  await Activities.findOne({
    where: { establishmentId: establishment.id }
  }).then(async (record) => {
    if (!record) {
      logEmitter.emit("info", `No Activities found for ${registration.id}`);
    } else {
      await record
        .update({
          customer_type: transform(CustomerTypeMapping, record.customer_type),
          import_export_activities: transform(
            ImportExportActivitiesMapping,
            record.import_export_activities
          ),
          water_supply: transform(WaterSupplyMapping, record.water_supply),
          business_type: transform(BusinessTypesMapping, record.business_type)
        })
        .then(() => {
          logEmitter.emit("info", `Activities updated for ${registration.id}`);
        });
    }
  });
};

const applyCosmosTransforms = async (registration, transform, newStatus) => {
  logEmitter.emit(
    "info",
    `Updating BE Cache FSA-RN: ${registration["fsa-rn"]}`
  );
  try {
    await beCache.updateOne(
      { "fsa-rn": registration["fsa-rn"] },
      {
        $set: {
          "migration-2-8-0-enums-status": newStatus,
          "establishment.operator.operator_type": transform(
            OperatorTypeMapping,
            registration.establishment.operator.operator_type
          ),
          "establishment.premise.establishment_type": transform(
            EstablishmentTypeMapping,
            registration.establishment.premise.establishment_type
          ),
          "establishment.activities.customer_type": transform(
            CustomerTypeMapping,
            registration.establishment.activities.customer_type
          ),
          "establishment.activities.import_export_activities": transform(
            ImportExportActivitiesMapping,
            registration.establishment.activities.import_export_activities
          ),
          "establishment.activities.water_supply": transform(
            WaterSupplyMapping,
            registration.establishment.activities.water_supply
          ),
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
          "migration-2-8-0-enums-status": err.message
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

const migratePgDataToEnums = async (queryInterface, Sequelize) => {
  await connectToDb();

  // Creates table to store update statuses (if it doesn't already exist from previous migration attempt)
  await queryInterface
    .createTable(
      { tableName: "tmp280MigrationStatus", schema: "registrations" },
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
          'SELECT * FROM registrations."registrations" reg LEFT JOIN registrations."tmp280MigrationStatus" status ON status."registrationId" = reg."id" WHERE status."registrationId" IS NULL',
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        )
        .then(async (regs) => {
          const promises = regs.map(async (reg) => {
            try {
              await applyPgTransforms(reg, transformToKey).then(async () => {
                await queryInterface.sequelize
                  .query(
                    `INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'true')`
                  )
                  .then(() => {
                    logEmitter.emit(
                      "info",
                      `Successfully updated Temp-Store ID: ${reg.id}`
                    );
                  });
              });
            } catch (err) {
              logEmitter.emit(
                "info",
                `Failed to update Temp-Store ID: ${reg.id} ${err.message}`
              );
              await queryInterface.sequelize.query(
                `INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum migration: ${err.message}')`
              );
            }
          });
          await Promise.allSettled(promises);
        });
    });
};

const migratePgDataFromEnums = async (queryInterface) => {
  await connectToDb();

  // Find registrations that haven't already been successfully updated
  await queryInterface.sequelize
    .query(
      'SELECT * FROM registrations."registrations" reg INNER JOIN registrations."tmp280MigrationStatus" status ON status."registrationId" = reg."id"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    .then(async (regs) => {
      const promises = regs.map(async (reg) => {
        try {
          await applyPgTransforms(reg, transformToValue).then(async () => {
            await queryInterface.sequelize
              .query(
                `DELETE FROM registrations."tmp280MigrationStatus" WHERE "registrationId"=${reg.id})`
              )
              .then(() => {
                logEmitter.emit(
                  "info",
                  `Successfully updated Temp-Store ID: ${reg.id}`
                );
              });
          });
        } catch (err) {
          logEmitter.emit(
            "info",
            `Failed to update Temp-Store ID: ${reg.id} ${err.message}`
          );
          await queryInterface.sequelize.query(
            `INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum un-migration: ${err.message}')`
          );
        }
      });
      await Promise.allSettled(promises);
    });
};

let beCache = undefined;
const migrateCosmosDataToEnums = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  // Find documents that haven't already been successfully updated
  const registrations = await beCache
    .find({ "migration-2-8-0-enums-status": { $ne: true } })
    .toArray();

  const promises = registrations.map(async (reg) => {
    await applyCosmosTransforms(reg, transformToKey, true).then(() => {
      logEmitter.emit(
        "info",
        `Successfully updated BE Cache FSA-RN: ${reg["fsa-rn"]}`
      );
    });
  });
  await Promise.allSettled(promises);
};

const migrateCosmosDataFromEnums = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  // Find documents that have been updated
  const registrations = await beCache
    .find({ "migration-2-8-0-enums-status": true })
    .toArray();

  const promises = registrations.map(async (reg) => {
    await applyCosmosTransforms(reg, transformToValue, false).then(() => {
      logEmitter.emit(
        "info",
        `Successfully updated BE Cache FSA-RN: ${reg["fsa-rn"]}`
      );
    });
  });
  await Promise.allSettled(promises);
};

module.exports = {
  migratePgDataToEnums,
  migratePgDataFromEnums,
  migrateCosmosDataToEnums,
  migrateCosmosDataFromEnums
};
