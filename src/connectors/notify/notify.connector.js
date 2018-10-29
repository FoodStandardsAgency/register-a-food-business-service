const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { NOTIFY_KEY } = require("../../config");
const { logEmitter } = require("../../services/logging.service");
const fs = require("fs");
const path = require("path");

const sendSingleEmail = async (templateId, recipientEmail, flattenedData) => {
  logEmitter.emit("functionCall", "notify.connector", "sendSingleEmail");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit("doubleMode", "notify.connector", "sendSingleEmail");
    notifyClient = notifyClientDouble;
  } else {
    notifyClient = new NotifyClient(NOTIFY_KEY);
  }

  const readFile = filename => {
    return new Promise(function(resolve, reject) {
      fs.readFile(path.resolve(__dirname, filename), function(err, pdf_file) {
        if (err) reject(err);
        else {
          resolve(pdf_file);
        }
      });
    });
  };

  const pdf_file = await readFile("basics.pdf");
  flattenedData.link_to_document = notifyClient.prepareUpload(pdf_file);

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
