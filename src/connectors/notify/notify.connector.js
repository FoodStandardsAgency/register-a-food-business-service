const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { info, error } = require("winston");

const sendSingleEmail = async (templateId, recipientEmail, data) => {
  info("notify.connector: sendSingleEmail: called");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    info("notify.connector: running in double mode");
    notifyClient = notifyClientDouble;
  } else {
    notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
  }

  try {
    const notifyArguments = [
      templateId,
      recipientEmail,
      { personalisation: data }
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
