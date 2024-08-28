const { logEmitter } = require("./logging.service");

const transformRegForCollections = (registration, apiVersion) => {
  // Transform the registrations returned from cosmos to the collections API expected format
  logEmitter.emit("functionCall", "collectionsTransform.service", "transformRegForCollection");

  const establishmentObject = {};
  try {
    if (registration.establishment) {
      const {
        establishment_keys,
        operator_keys,
        activities_keys,
        premise_keys,
        versionSpecificTransforms
      } = require(`./collectionsTransform.${apiVersion}.keys`);

      let establishment = {};
      let operator = {};
      let activities = {};
      let premise = {};

      establishment_keys.forEach((key) => {
        establishment[key] =
          registration.establishment.establishment_details[key] ||
          registration.establishment.establishment_details[key] === "" ||
          registration.establishment.establishment_details[key] === false
            ? registration.establishment.establishment_details[key]
            : null;
      });

      operator_keys.forEach((key) => {
        operator[key] =
          registration.establishment.operator[key] ||
          registration.establishment.operator[key] === "" ||
          registration.establishment.operator[key] === false
            ? registration.establishment.operator[key]
            : key === "partners"
              ? []
              : null;
      });

      // Front end uses "operator_companies_house_number" but API uses operator_company_house_number
      // so needs conversion for collections
      if (!operator["operator_company_house_number"]) {
        operator["operator_company_house_number"] = operator["operator_companies_house_number"];
      }
      delete operator["operator_companies_house_number"];

      activities_keys.forEach((key) => {
        activities[key] =
          registration.establishment.activities[key] ||
          registration.establishment.activities[key] === "" ||
          registration.establishment.activities[key] === false
            ? registration.establishment.activities[key]
            : null;
      });

      premise_keys.forEach((key) => {
        premise[key] =
          registration.establishment.premise[key] ||
          registration.establishment.premise[key] === "" ||
          registration.establishment.premise[key] === false
            ? registration.establishment.premise[key]
            : null;
      });

      versionSpecificTransforms(establishment, operator, activities, premise);

      Object.assign(establishmentObject, establishment, { operator }, { activities }, { premise });
    }

    const formattedRegistration = {
      fsa_rn: registration["fsa-rn"],
      council: registration.hygiene
        ? registration.hygiene.local_council
        : registration.hygieneAndStandards.local_council,
      competent_authority_id: registration.source_council_id,
      local_council_url: registration.local_council_url,
      collected: registration.collected,
      collected_at: registration.collected_at ? registration.collected_at.toISOString() : null,
      createdAt: registration.reg_submission_date.toISOString(),
      updatedAt: registration.collected_at
        ? registration.collected_at.toISOString()
        : registration.reg_submission_date.toISOString(),
      establishment: establishmentObject,
      metadata: registration.declaration ? registration.declaration : {}
    };

    logEmitter.emit("functionSuccess", "collectionsTransform.service", "transformRegForCollection");
    return formattedRegistration;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "collectionsTransform.service",
      "transformRegForCollection",
      err
    );
  }
};

module.exports = { transformRegForCollections };
