const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { info, error } = require("winston");
const optionalData = [
  "operator_first_name",
  "operator_last_name",
  "operator_street",
  "operator_town",
  "operator_primary_number",
  "operator_secondary_number",
  "operator_email",
  "operator_company_name",
  "operator_company_house_number",
  "operator_charity_name",
  "operator_charity_number",
  "establishment_street",
  "establishment_town",
  "establishment_primary_number",
  "establishment_secondary_number",
  "establishment_email",
  "establishment_trading_name",
  "establishment_opening_date",
  "contact_representative_name",
  "contact_representative_number",
  "contact_representative_role",
  "contact_representative_email"
];

const sendSingleEmail = async (
  templateId,
  recipientEmail,
  registration,
  postRegistrationMetadata,
  localCouncilContactDetails
) => {
  info("notify.connector: sendSingleEmail: called");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    info("notify.connector: running in double mode");
    notifyClient = notifyClientDouble;
  } else {
    try {
      notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
    } catch (err) {
      error(`notify.connector: sendSingleEmail errored: ${err}`);
      throw new Error(
        "notify.connector: sendSingleEmail: NOTIFY_KEY environment variable either incorrect or missing, or NotifyClient has failed."
      );
    }
  }

  const flattenedData = Object.assign(
    {},
    registration.establishment.premise,
    registration.establishment.establishment_details,
    registration.establishment.operator,
    registration.establishment.activities,
    registration.metadata,
    postRegistrationMetadata,
    localCouncilContactDetails
  );

  optionalData.forEach(key => {
    if (flattenedData[key]) {
      flattenedData[`${key}_exists`] = "yes";
    } else {
      flattenedData[key] = "";
      flattenedData[`${key}_exists`] = "no";
    }
  });

  try {
    const notifyArguments = [
      templateId,
      recipientEmail,
      { personalisation: flattenedData }
    ];

    const notifyResponse = await notifyClient.sendEmail(...notifyArguments);
    const responseBody = notifyResponse.body;

    info("notify.connector: sendSingleEmail: successful");
    return responseBody;
  } catch (err) {
    error(`notify.connector: sendSingleEmail: errored with: ${err}`);
    throw new Error(err.message);
  }
};

module.exports = { sendSingleEmail };
