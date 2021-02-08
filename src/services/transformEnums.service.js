const {
  operatorTypeEnum,
  establishmentTypeEnum,
  customerTypeEnum,
  importExportEnum,
  waterSupplyEnum,
  businessTypeEnum
} = require("@slice-and-dice/register-a-food-business-validation");

// Functions that convert enums from keys to values.

const transformEstablishmentTypeEnum = (establishmentType, language) => {
  const lang = language || "en";
  return establishmentTypeEnum[establishmentType]
    ? establishmentTypeEnum[establishmentType].value[lang]
    : null;
};

const transformOperatorTypeEnum = (operatorType, language) => {
  const lang = language || "en";
  return operatorTypeEnum[operatorType]
    ? operatorTypeEnum[operatorType].value[lang]
    : null;
};

const transformWaterSupplyEnum = (waterSupply, language) => {
  const lang = language || "en";
  return waterSupplyEnum[waterSupply]
    ? waterSupplyEnum[waterSupply].value[lang]
    : null;
};

const transformBusinessImportExportEnum = (
  importExportActivities,
  language
) => {
  const lang = language || "en";
  return importExportEnum[importExportActivities]
    ? importExportEnum[importExportActivities].value[lang]
    : null;
};

const transformCustomerTypeEnum = (customerType, language) => {
  const lang = language || "en";
  return customerTypeEnum[customerType]
    ? customerTypeEnum[customerType].value[lang]
    : null;
};

const transformBusinessTypeEnum = (id, language) => {
  const lang = language || "en";
  return businessTypeEnum[id] ? businessTypeEnum[id].value[lang] : null;
};

module.exports = {
  transformBusinessImportExportEnum,
  transformBusinessTypeEnum,
  transformCustomerTypeEnum,
  transformEstablishmentTypeEnum,
  transformOperatorTypeEnum,
  transformWaterSupplyEnum
};
