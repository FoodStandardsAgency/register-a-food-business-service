const {
  operatorTypeEnum,
  establishmentTypeEnum,
  customerTypeEnum,
  importExportEnum,
  waterSupplyEnum,
  businessTypeEnum
} = require("@slice-and-dice/register-a-food-business-validation");

const { logEmitter } = require("./logging.service");

// Mapping V2 Business Type strings to V1 strings
const v1BusinessTypesMapping = {
  "Hunter and trapper": "Hunting and trapping",
  "Dairy and cheese manufacturer": "Dairies and cheese manufacturer",
  "Sweet shop or confectioner": "Sweet shop or Confectioner",
  "Market stall with permanent location": "Market stalls with permanent pitch",
  "Restaurant, cafe, canteen, or fast food restaurant":
    "Restaurant, cafe, canteen or fast food",
  "Hostel or bed & breakfast": "Hostel or bed and breakfast"
};

const transformEnumsForCollections = (apiVersion, registrations) => {
  logEmitter.emit("functionCall", "v1EnumTransform.service", "transformEnums");
  let transform =
    Number(apiVersion) >= 2 || apiVersion === "latest"
      ? transformToKey
      : transformToValue;

  // DB data has been migrated to new format so only need to do this for v1 APIs
  if (Number(apiVersion) < 2) {
    if (Array.isArray(registrations)) {
      registrations.forEach(function (reg) {
        applyEnumTransformsForCollections(reg, transform);
      });
    } else {
      applyEnumTransformsForCollections(registrations, transform);
    }
  }
};

const applyEnumTransformsForCollections = (registration, transform) => {
  logEmitter.emit(
    "functionCall",
    "transformEnums.service",
    "applyTransformsForCollections"
  );
  if (registration.establishment) {
    if (registration.establishment.operator) {
      registration.establishment.operator.operator_type = transform(
        operatorTypeEnum,
        registration.establishment.operator.operator_type
      );
    }
    if (registration.establishment.premise) {
      registration.establishment.premise.establishment_type = transform(
        establishmentTypeEnum,
        registration.establishment.premise.establishment_type
      );
    }
    if (registration.establishment.activities) {
      registration.establishment.activities.customer_type = transform(
        customerTypeEnum,
        registration.establishment.activities.customer_type
      );
      registration.establishment.activities.import_export_activities = transform(
        importExportEnum,
        registration.establishment.activities.import_export_activities
      );
      registration.establishment.activities.water_supply = transform(
        waterSupplyEnum,
        registration.establishment.activities.water_supply
      );
      registration.establishment.activities.business_type = transform(
        businessTypeEnum,
        registration.establishment.activities.business_type
      );
      registration.establishment.activities.business_type = transformV2BusinessTypeString(
        registration.establishment.activities.business_type
      );
    }
  }
};

const transformEnumsForService = (data, language) => {
  logEmitter.emit(
    "functionCall",
    "transformEnums.service",
    "applyTransformsForService"
  );
  if (data.operator_type) {
    data.operator_type = transformToValue(
      operatorTypeEnum,
      data.operator_type,
      language
    );
  }
  if (data.establishment_type) {
    data.establishment_type = transformToValue(
      establishmentTypeEnum,
      data.establishment_type,
      language
    );
  }
  if (data.customer_type) {
    data.customer_type = transformToValue(
      customerTypeEnum,
      data.customer_type,
      language
    );
  }
  if (data.import_export_activities) {
    data.import_export_activities = transformToValue(
      importExportEnum,
      data.import_export_activities,
      language
    );
  }
  if (data.water_supply) {
    data.water_supply = transformToValue(
      waterSupplyEnum,
      data.water_supply,
      language
    );
  }
  if (data.business_type) {
    data.business_type = transformToValue(
      businessTypeEnum,
      data.business_type,
      language
    );
  }
};

// From v1 value to v2 enum key
const transformToKey = (enumType, value) => {
  logEmitter.emit("functionCall", "v1EnumTransform.service", "transformToKey");
  let transformedValue = value;
  Object.keys(enumType).forEach(function (enumKey) {
    if (enumType[enumKey].value.en === value) {
      transformedValue = enumType[enumKey].key;
    }
  });
  return transformedValue;
};

// From v2 enum key to v1 value
const transformToValue = (enumType, key, language) => {
  logEmitter.emit(
    "functionCall",
    "v1EnumTransform.service",
    "transformToValue"
  );
  const lang = language || "en";
  return enumType[key] ? enumType[key].value[lang] : key;
};

const transformV2BusinessTypeString = (value) => {
  logEmitter.emit(
    "functionCall",
    "v1EnumTransform.service",
    "transformV2BusinessTypeString"
  );
  return v1BusinessTypesMapping[value] ? v1BusinessTypesMapping[value] : value;
};

module.exports = {
  transformEnumsForCollections,
  transformEnumsForService
};
