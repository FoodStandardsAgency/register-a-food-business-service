const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { info, error } = require("winston");

const sendSingleEmail = async (
  templateId,
  recipientEmail,
  registration,
  postRegistrationMetadata
) => {
  info("notify.connector: sendSingleEmail: called");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    info("notify.connector: running in double mode");
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
    info("notify.connector: sendSingleEmail: successful");
    return responseBody;
  } catch (err) {
    error(`notify.connector: sendSingleEmail: errored with: ${err}`);
    throw new Error(err.message);
  }
};

module.exports = { sendSingleEmail };
