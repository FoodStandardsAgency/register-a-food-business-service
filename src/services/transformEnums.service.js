const {
  operatorTypeEnum,
  establishmentTypeEnum,
  customerTypeEnum,
  importExportEnum,
  waterSupplyEnum,
  businessTypeEnum
} = require("@slice-and-dice/register-a-food-business-validation");

// Functions that convert enums from keys to values.

const transformEstablishmentTypeEnum = (establishmentType) => {
  return establishmentTypeEnum[establishmentType]
    ? establishmentTypeEnum[establishmentType].value
    : null;
};

const transformOperatorTypeEnum = (operatorType) => {
  return operatorTypeEnum[operatorType]
    ? operatorTypeEnum[operatorType].value
    : null;
};

const transformWaterSupplyEnum = (waterSupply) => {
  return waterSupplyEnum[waterSupply]
    ? waterSupplyEnum[waterSupply].value
    : null;
};

const transformBusinessImportExportEnum = (importExportActivities) => {
  return importExportEnum[importExportActivities]
    ? importExportEnum[importExportActivities].value
    : null;
};

const transformCustomerTypeEnum = (customerType) => {
  return customerTypeEnum[customerType]
    ? customerTypeEnum[customerType].value
    : null;
};

const transformBusinessTypeEnum = (id) => {
  return businessTypeEnum[id] ? businessTypeEnum[id].value : null;
};

module.exports = {
  transformBusinessImportExportEnum,
  transformBusinessTypeEnum,
  transformCustomerTypeEnum,
  transformEstablishmentTypeEnum,
  transformOperatorTypeEnum,
  transformWaterSupplyEnum
};
