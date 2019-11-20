const request = require("request-promise-native");
const { tascomiAuth } = require("@slice-and-dice/fsa-rof");
const { doubleRequest } = require("./tascomi.double");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

const sendRequest = async (url, method, body, public_key, private_key) => {
  const tascomiApiOptions = {
    url: url,
    method: method,
    form: body
  };

  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit("doubleMode", "tascomi.connector", "sendRequest");
    return doubleRequest(tascomiApiOptions);
  } else {
    const auth = await tascomiAuth.generateSyncHash(
      public_key,
      private_key,
      process.env.NTP_SERVER
    );
    tascomiApiOptions.headers = {
      "X-Public": auth.public_key,
      "X-Hash": auth.hash
    };
    return request(tascomiApiOptions);
  }
};

const createFoodBusinessRegistration = async (
  registration,
  postRegistrationMetadata,
  auth
) => {
  logEmitter.emit(
    "functionCall",
    "tascomi.connector",
    "createFoodBusinessRegistration"
  );
  try {
    const url = `${auth.url}/online_food_business_registrations`;
    const premiseDetails = Object.assign(
      {},
      registration.establishment.premise
    );
    const establishmentDetails = Object.assign(
      {},
      registration.establishment.establishment_details
    );
    const operatorDetails = Object.assign(
      {},
      registration.establishment.operator
    );
    const activitiesDetails = Object.assign(
      {},
      registration.establishment.activities
    );
    const partnerDetails = registration.establishment.operator.partners
      ? registration.establishment.operator.partners.map(partner => ({
          ...partner
        }))
      : [];

    const requestData = {
      fsa_rn: postRegistrationMetadata["fsa-rn"],
      fsa_council_id: postRegistrationMetadata.hygiene_council_code,
      premise_name: establishmentDetails.establishment_trading_name,
      premise_building_number: premiseDetails.establishment_first_line,
      premise_street_name: premiseDetails.establishment_street,
      premise_town: premiseDetails.establishment_town,
      premise_postcode: premiseDetails.establishment_postcode,
      premise_primary_number: establishmentDetails.establishment_primary_number,
      premise_secondary_number:
        establishmentDetails.establishment_secondary_number,
      premise_email: establishmentDetails.establishment_email,
      opening_date: establishmentDetails.establishment_opening_date,
      owner_firstname: operatorDetails.operator_first_name,
      owner_surname: operatorDetails.operator_last_name,
      operator_type: operatorDetails.operator_type,
      operator_company_name: operatorDetails.operator_company_name,
      operator_companies_house_number:
        operatorDetails.operator_companies_house_number,
      operator_charity_name: operatorDetails.operator_charity_name,
      operator_charity_number: operatorDetails.operator_charity_number,
      contact_representative_number:
        operatorDetails.contact_representative_number,
      contact_representative_email:
        operatorDetails.contact_representative_email,
      contact_representative_name: operatorDetails.contact_representative_name,
      contact_representative_role: operatorDetails.contact_representative_role,
      owner_house_name_or_number: operatorDetails.operator_first_line,
      owner_street_name: operatorDetails.operator_street,
      owner_town: operatorDetails.operator_town,
      owner_postcode: operatorDetails.operator_postcode,
      owner_telephone: operatorDetails.operator_primary_number,
      owner_email: operatorDetails.operator_email,
      sales_activities_string: activitiesDetails.customer_type,
      business_type: activitiesDetails.business_type,
      accepted: "f",
      declined: "f",
      collected: false,
      partners: [],
      water_supply: activitiesDetails.water_supply,
      premise_typical_trading_times_monday_opening_times:
        activitiesDetails.opening_hours_monday,
      premise_typical_trading_times_tuesday_opening_times:
        activitiesDetails.opening_hours_tuesday,
      premise_typical_trading_times_wednesday_opening_times:
        activitiesDetails.opening_hours_wednesday,
      premise_typical_trading_times_thursday_opening_times:
        activitiesDetails.opening_hours_thursday,
      premise_typical_trading_times_friday_opening_times:
        activitiesDetails.opening_hours_friday,
      premise_typical_trading_times_saturday_opening_times:
        activitiesDetails.opening_hours_saturday,
      premise_typical_trading_times_sunday_opening_times:
        activitiesDetails.opening_hours_sunday
    };
    partnerDetails.forEach(partner => {
      requestData.partners.push({
        partner_name: partner.partner_name,
        partner_is_primary_contact:
          partner.partner_is_primary_contact === true ? "t" : "f"
      });
    });
    if (activitiesDetails.opening_day_monday === true) {
      requestData.premise_typical_trading_days_monday = "t";
    } else {
      requestData.premise_typical_trading_days_monday = "f";
    }
    if (activitiesDetails.opening_day_tuesday === true) {
      requestData.premise_typical_trading_days_tuesday = "t";
    } else {
      requestData.premise_typical_trading_days_tuesday = "f";
    }
    if (activitiesDetails.opening_day_wednesday === true) {
      requestData.premise_typical_trading_days_wednesday = "t";
    } else {
      requestData.premise_typical_trading_days_wednesday = "f";
    }
    if (activitiesDetails.opening_day_thursday === true) {
      requestData.premise_typical_trading_days_thursday = "t";
    } else {
      requestData.premise_typical_trading_days_thursday = "f";
    }
    if (activitiesDetails.opening_day_friday === true) {
      requestData.premise_typical_trading_days_friday = "t";
    } else {
      requestData.premise_typical_trading_days_friday = "f";
    }
    if (activitiesDetails.opening_day_saturday === true) {
      requestData.premise_typical_trading_days_saturday = "t";
    } else {
      requestData.premise_typical_trading_days_saturday = "f";
    }
    if (activitiesDetails.opening_day_sunday === true) {
      requestData.premise_typical_trading_days_sunday = "t";
    } else {
      requestData.premise_typical_trading_days_sunday = "f";
    }

    if (premiseDetails.establishment_type === "Home or domestic premises") {
      requestData.premise_domestic_premises = "t";
    } else {
      requestData.premise_domestic_premises = "f";
    }
    if (premiseDetails.establishment_type === "Mobile or moveable premises") {
      requestData.premise_mobile_premises = "t";
    } else {
      requestData.premise_mobile_premises = "f";
    }
    if (activitiesDetails.import_export_activities === "Directly import") {
      requestData.import_food = "t";
    } else if (
      activitiesDetails.import_export_activities === "Directly export"
    ) {
      requestData.export_food = "t";
    } else if (
      activitiesDetails.import_export_activities ===
      "Directly import and export"
    ) {
      requestData.import_food = "t";
      requestData.export_food = "t";
    }

    const response = await sendRequest(
      url,
      "PUT",
      requestData,
      auth.public_key,
      auth.private_key
    );

    statusEmitter.emit(
      "incrementCount",
      "tascomiCreateRegistrationCallsSucceeded"
    );
    statusEmitter.emit(
      "setStatus",
      "mostRecentTascomiCreateRegistrationSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "tascomi.connector",
      "createFoodBusinessRegistration"
    );
    return response;
  } catch (err) {
    statusEmitter.emit(
      "incrementCount",
      "tascomiCreateRegistrationCallsFailed"
    );
    statusEmitter.emit(
      "setStatus",
      "mostRecentTascomiCreateRegistrationSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "tascomi.connector",
      "createFoodBusinessRegistration",
      err
    );
    if (err.statusCode === 401) {
      err.name = "tascomiAuth";
    }
    throw err;
  }
};

const createReferenceNumber = async (id, auth) => {
  logEmitter.emit("functionCall", "tascomi.connector", "createReferenceNumber");
  try {
    const url = `${auth.url}/online_food_business_registrations/${id}`;
    const online_reference = id.padStart(7, "0");
    const requestData = {
      online_reference
    };
    const response = await sendRequest(
      url,
      "POST",
      requestData,
      auth.public_key,
      auth.private_key
    );

    statusEmitter.emit(
      "incrementCount",
      "tascomiCreateRefnumberCallsSucceeded"
    );
    statusEmitter.emit(
      "setStatus",
      "mostRecentTascomiCreateRefnumberSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "tascomi.connector",
      "createReferenceNumber"
    );
    return response;
  } catch (err) {
    statusEmitter.emit("incrementCount", "tascomiCreateRefnumberCallsFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentTascomiCreateRefnumberSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "tascomi.connector",
      "createReferenceNumber",
      err
    );
    if (err.statusCode === 401) {
      err.name = "tascomiAuth";
    }
    throw err;
  }
};

module.exports = { createFoodBusinessRegistration, createReferenceNumber };
