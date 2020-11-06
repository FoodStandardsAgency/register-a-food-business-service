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

const applyCosmosTransforms = async (registration, transform) => {
  logEmitter.emit(
    "info",
    `Updating BE Cache FSA-RN: ${registration["fsa-rn"]}`
  );
  await beCache.updateOne(
    { "fsa-rn": registration["fsa-rn"] },
    {
      $set: {
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

const migratePgDataToEnums = async (toEnums) => {
  let transform = toEnums ? transformToKey : transformToValue;
  connectToDb();
  const registrations = await Registration.findAll();

  await registrations.forEach(async (reg) => {
    await applyPgTransforms(reg, transform);
  });
};

let beCache = undefined;
const migrateCosmosDataToEnums = async (toEnums) => {
  let transform = toEnums ? transformToKey : transformToValue;
  beCache = await establishConnectionToMongo();
  registrations = beCache.find();

  await registrations.forEach(async (reg) => {
    await applyCosmosTransforms(reg, transform);
  });
};

module.exports = { migratePgDataToEnums, migrateCosmosDataToEnums };
