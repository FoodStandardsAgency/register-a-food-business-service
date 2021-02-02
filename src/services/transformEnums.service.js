const {
  operatorTypeEnum,
  establishmentTypeEnum,
  customerTypeEnum,
  importExportEnum,
  waterSupplyEnum,
  businessTypeEnum
} = require("@slice-and-dice/register-a-food-business-validation");

// Functions that convert enums from keys to values.

const transformEstablishmentTypeEnum = (establishmentType, language = "en") => {
  return establishmentTypeEnum[establishmentType]
    ? establishmentTypeEnum[establishmentType].value[language]
    : null;
};

const transformOperatorTypeEnum = (operatorType, language = "en") => {
  return operatorTypeEnum[operatorType]
    ? operatorTypeEnum[operatorType].value[language]
    : null;
};

const transformWaterSupplyEnum = (waterSupply, language = "en") => {
  return waterSupplyEnum[waterSupply]
    ? waterSupplyEnum[waterSupply].value[language]
    : null;
};

const transformBusinessImportExportEnum = (
  importExportActivities,
  language = "en"
) => {
  return importExportEnum[importExportActivities]
    ? importExportEnum[importExportActivities].value[language]
    : null;
};

const transformCustomerTypeEnum = (customerType, language = "en") => {
  return customerTypeEnum[customerType]
    ? customerTypeEnum[customerType].value[language]
    : null;
};

const transformBusinessTypeEnum = (id, language = "en") => {
  return businessTypeEnum[id] ? businessTypeEnum[id].value[language] : null;
};

module.exports = {
  transformBusinessImportExportEnum,
  transformBusinessTypeEnum,
  transformCustomerTypeEnum,
  transformEstablishmentTypeEnum,
  transformOperatorTypeEnum,
  transformWaterSupplyEnum
};
