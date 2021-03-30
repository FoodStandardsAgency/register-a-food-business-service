const { logEmitter } = require("./logging.service");

const transformRegForCollections = (registration) => {
  // Transform the registrations returned from cosmos to the collections API expected format
  logEmitter.emit(
    "functionCall",
    "registrationTransform.v2.service",
    "transformRegForCollection"
  );

  const establishmentObject = {};
  try {
    if (registration.establishment) {
      const establishment_keys = [
        "establishment_trading_name",
        "establishment_opening_date",
        "establishment_primary_number",
        "establishment_secondary_number",
        "establishment_email"
      ];

      const operator_keys = [
        "operator_type",
        "operator_company_name",
        "operator_charity_name",
        "operator_charity_number",
        "operator_first_name",
        "operator_last_name",
        "operator_postcode",
        "operator_uprn",
        "operator_address_line_1",
        "operator_address_line_2",
        "operator_address_line_3",
        "operator_town",
        "operator_primary_number",
        "operator_secondary_number",
        "operator_email",
        "contact_representative_name",
        "contact_representative_role",
        "contact_representative_number",
        "contact_representative_email",
        "partners",
        "operator_company_house_number"
      ];

      const activities_keys = [
        "customer_type",
        "business_type",
        "business_type_search_term",
        "import_export_activities",
        "water_supply",
        "business_other_details",
        "opening_days_irregular",
        "opening_day_monday",
        "opening_day_tuesday",
        "opening_day_wednesday",
        "opening_day_thursday",
        "opening_day_friday",
        "opening_day_saturday",
        "opening_day_sunday",
        "opening_hours_monday",
        "opening_hours_tuesday",
        "opening_hours_wednesday",
        "opening_hours_thursday",
        "opening_hours_friday",
        "opening_hours_saturday",
        "opening_hours_sunday"
      ];

      const premise_keys = [
        "establishment_address_line_1",
        "establishment_address_line_2",
        "establishment_address_line_3",
        "establishment_town",
        "establishment_postcode",
        "establishment_uprn",
        "establishment_type"
      ];

      let establishment = {};
      let operator = {};
      let activities = {};
      let premise = {};

      establishment_keys.forEach((key) => {
        establishment[key] = registration.establishment.establishment_details[
          key
        ]
          ? registration.establishment.establishment_details[key]
          : null;
      });
      operator_keys.forEach((key) => {
        operator[key] = registration.establishment.operator[key]
          ? registration.establishment.operator[key]
          : key === "partners"
          ? []
          : null;
      });

      activities_keys.forEach((key) => {
        activities[key] = registration.establishment.activities[key]
          ? registration.establishment.activities[key]
          : null;
      });

      premise_keys.forEach((key) => {
        premise[key] = registration.establishment.premise[key]
          ? registration.establishment.premise[key]
          : null;
      });

      Object.assign(
        establishmentObject,
        establishment,
        { operator },
        { activities },
        { premise }
      );
    }

    const formattedRegistration = {
      fsa_rn: registration["fsa-rn"],
      council: registration.hygiene
        ? registration.hygiene.local_council
        : registration.hygieneAndStandards.local_council,
      competent_authority_id: registration.source_council_id,
      local_council_url: registration.local_council_url,
      collected: registration.collected,
      collected_at: registration.collected_at
        ? registration.collected_at.toISOString()
        : null,
      createdAt: registration.reg_submission_date.toISOString(),
      updatedAt: registration.collected_at
        ? registration.collected_at.toISOString()
        : registration.reg_submission_date.toISOString(),
      establishment: establishmentObject,
      metadata: registration.declaration ? registration.declaration : {}
    };

    logEmitter.emit(
      "functionSuccess",
      "registrationTransform.v2.service",
      "transformRegForCollection"
    );
    return formattedRegistration;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "registrationTransform.v2.service",
      "transformRegForCollection",
      err
    );
  }
};

module.exports = { transformRegForCollections };
