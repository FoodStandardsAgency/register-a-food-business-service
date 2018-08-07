const request = require("request-promise-native");
const { info, error } = require("winston");
const { tascomiAuth } = require("@slice-and-dice/fsa-rof");
const { doubleRequest } = require("./tascomi.double");

const sendRequest = async (url, method, body) => {
  const auth = await tascomiAuth.generateSyncHash(
    process.env.PUBLIC_KEY,
    process.env.PRIVATE_KEY,
    process.env.NTP_SERVER
  );
  const tascomiApiOptions = {
    url: url,
    method: method,
    headers: {
      "X-Public": auth.public_key,
      "X-Hash": auth.hash
    },
    form: body
  };
  if (process.env.DOUBLE_MODE === "true") {
    info("tascomi.connector: running in double mode");
    return doubleRequest(tascomiApiOptions);
  }
  return request(tascomiApiOptions);
};

const createFoodBusinessRegistration = async (registration, fsa_rn) => {
  info("tascomi.connector: createFoodBusinessRegistration: called");
  try {
    const url = `${process.env.TASCOMI_URL}online_food_business_registrations`;
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

    const requestData = {
      fsa_rn: fsa_rn,
      premise_name: establishmentDetails.establishment_trading_name,
      premise_building_number: premiseDetails.establishment_first_line,
      premise_street_name: premiseDetails.establishment_street,
      premise_town: premiseDetails.establishment_town,
      premise_postcode: premiseDetails.establishment_postcode,
      premise_typical_trading_days_monday: "f",
      premise_typical_trading_days_tuesday: "f",
      premise_typical_trading_days_wednesday: "f",
      premise_typical_trading_days_thursday: "f",
      premise_typical_trading_days_friday: "f",
      premise_typical_trading_days_saturday: "f",
      premise_typical_trading_days_sunday: "f",
      opening_date: establishmentDetails.establishment_opening_date,
      owner_firstname: operatorDetails.operator_first_name,
      owner_surname: operatorDetails.operator_last_name,
      operator_type: operatorDetails.operator_type,
      operator_company_name: operatorDetails.operator_company_name,
      operator_company_house_number:
        operatorDetails.operator_company_house_number,
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
      accepted: "f",
      declined: "f"
    };
    if (premiseDetails.establishment_type === "Home or domestic premises") {
      requestData.premise_domestic_premises = "t";
    } else {
      requestData.premise_domestic_premises = "f";
    }

    const response = await sendRequest(url, "PUT", requestData);
    info("tascomi.connector: createFoodBusinessRegistration: successful");
    return response;
  } catch (err) {
    error(
      `tascomi.connector: createFoodBusinessRegistration: errored with: ${err}`
    );
    return err;
  }
};

const createReferenceNumber = async id => {
  info("tascomi.connector: createReferenceNumber: called");
  try {
    const url = `${
      process.env.TASCOMI_URL
    }online_food_business_registrations/${id}`;
    const online_reference = id.padStart(7, "0");
    const requestData = {
      online_reference
    };
    const response = await sendRequest(url, "POST", requestData);
    info("tascomi.connector: createReferenceNumber: successful");
    return response;
  } catch (err) {
    error(`tascomi.connector: createReferenceNumber: errored with: ${err}`);
    return err;
  }
};

module.exports = { createFoodBusinessRegistration, createReferenceNumber };
