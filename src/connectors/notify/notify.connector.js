const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { logEmitter } = require("../../services/logging.service");
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
  logEmitter.emit("functionCall", "notify.connector", "sendSingleEmail");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit("doubleMode", "notify.connector", "sendSingleEmail");
    notifyClient = notifyClientDouble;
  } else {
    notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
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
    logEmitter.emit("functionSuccess", "notify.connector", "sendSingleEmail");
    return responseBody;
  } catch (err) {
    const newError = new Error("Notify error");
    if (err.message === "secretOrPrivateKey must have a value") {
      newError.name = "notifyMissingKey";
    }
    if (err.statusCode === 400) {
      if (err.error.errors[0].error === "ValidationError") {
        newError.name = "notifyInvalidTemplate";
        newError.message = err.message;
      }
      if (err.error.errors[0].error === "BadRequestError") {
        newError.name = "notifyMissingPersonalisation";
        newError.message = err.message;
      }
    }
    logEmitter.emit(
      "functionFail",
      "notify.connector",
      "sendSingleEmail",
      newError
    );
    throw newError;
  }
};

module.exports = { sendSingleEmail };
