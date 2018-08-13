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
    try {
      notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "notify.connector",
        "sendSingleEmail",
        err
      );
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
    throw new Error(err.message);
  }
};

module.exports = { sendSingleEmail };
