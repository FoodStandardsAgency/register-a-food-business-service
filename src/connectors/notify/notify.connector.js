const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { logEmitter } = require("../../services/logging.service");

const sendSingleEmail = async (
  templateId,
  recipientEmail,
  registration,
  postRegistrationMetadata
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
    postRegistrationMetadata
  );

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
    logEmitter.emit("functionFail", "notify.connector", "sendSingleEmail", err);
    const newError = new Error();
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
    throw newError;
  }
};

module.exports = { sendSingleEmail };
