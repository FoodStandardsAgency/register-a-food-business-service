const {
  Registration,
  Operator,
  Activities,
  Premise,
  connectToDb
} = require("../src/db/db");
const {
  getEstablishmentByRegId
} = require("../src/connectors/registrationDb/registrationDb");
const { logEmitter } = require("../src/services/logging.service");
const {
  establishConnectionToMongo
} = require("../src/connectors/cacheDb/cacheDb.connector");
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
    throw new Error("No establishment found");
  }

  Operator.findOne({ where: { establishmentId: establishment.id } }).then(
    (record) => {
      if (!record) {
        throw new Error("No Operator found");
      }
      record.update({
        operator_type: transform(OperatorTypeMapping, record.operator_type)
      });
    }
  );

  Premise.findOne({ where: { establishmentId: establishment.id } }).then(
    (record) => {
      if (!record) {
        throw new Error("No Premise found");
      }
      record.update({
        establishment_type: transform(
          EstablishmentTypeMapping,
          record.establishment_type
        )
      });
    }
  );

  Activities.findOne({ where: { establishmentId: establishment.id } }).then(
    (record) => {
      if (!record) {
        throw new Error("No Activities found");
      }
      record.update({
        customer_type: transform(CustomerTypeMapping, record.customer_type),
        import_export_activities: transform(
          ImportExportActivitiesMapping,
          record.import_export_activities
        ),
        water_supply: transform(WaterSupplyMapping, record.water_supply),
        business_type: transform(BusinessTypesMapping, record.business_type)
      });
    }
  );
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
    await beCache.updateOne(
      { "fsa-rn": registration["fsa-rn"] },
      {
        $set: {
          "migration-2-8-0-enums-status": err.message,
        }
      }
    );
  }
};

const transformToKey = (enumType, value) => {
  let transformedValue = value;
  Object.keys(enumType).forEach(function (enumKey) {
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
  connectToDb();

  // Creates table to store update statuses (if it doesn't already exist from previous migration attempt)
  await queryInterface.createTable(
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
  );

  // Find registrations that haven't already been successfully updated
  queryInterface.sequelize.query(
    'SELECT * FROM registrations."registrations" reg LEFT JOIN registrations."tmp280MigrationStatus" status ON status."registrationId" = reg."id" WHERE status."registrationId" IS NULL',
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  ).then(async function(regs) {
    await regs.forEach(async (reg) => {
      try {
        await applyPgTransforms(reg, transformToKey);
        queryInterface.sequelize.query(`INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'true')`);
      } catch (err) {
        queryInterface.sequelize.query(`INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum migration: ${err.message}')`);
      }
    });
  });
};

const migratePgDataFromEnums = async (queryInterface) => {
  connectToDb();

  // Find registrations that haven't already been successfully updated
  queryInterface.sequelize.query(
    'SELECT * FROM registrations."registrations" reg INNER JOIN registrations."tmp280MigrationStatus" status ON status."registrationId" = reg."id"',
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  ).then(async function(regs) {
    await regs.forEach(async (reg) => {
      try {
        await applyPgTransforms(reg, transformToValue);
        queryInterface.sequelize.query(`DELETE FROM registrations."tmp280MigrationStatus" WHERE "registrationId"=${reg.id})`);
      } catch (err) {
        queryInterface.sequelize.query(`INSERT INTO registrations."tmp280MigrationStatus" ("registrationId", "status") values (${reg.id}, 'Error during enum un-migration: ${err.message}')`);
      }
    });
  });
};

let beCache = undefined;
const migrateCosmosDataToEnums = async () => {
  beCache = await establishConnectionToMongo();

  // Find documents that haven't already been successfully updated
  const registrations = beCache.find({"migration-2-8-0-enums-status":{ $ne: true }});

  await registrations.forEach(async (reg) => {
    await applyCosmosTransforms(reg, transformToKey, true);
  });
};

const migrateCosmosDataFromEnums = async () => {
  beCache = await establishConnectionToMongo();

  // Find documents that have been updated
  const registrations = beCache.find({"migration-2-8-0-enums-status": true});

  await registrations.forEach(async (reg) => {
    await applyCosmosTransforms(reg, transformToValue, false);
  });
};

module.exports = { migratePgDataToEnums, migratePgDataFromEnums, migrateCosmosDataToEnums, migrateCosmosDataFromEnums };
