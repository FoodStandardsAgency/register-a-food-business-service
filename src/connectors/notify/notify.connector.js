const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { NOTIFY_KEY } = require("../../config");
const { logEmitter } = require("../../services/logging.service");

const sendSingleEmail = async (
  templateId,
  recipientEmail,
  flattenedData,
  pdfFile
) => {
  logEmitter.emit("functionCall", "notify.connector", "sendSingleEmail");

  let notifyClient;

  if (process.env.DOUBLE_MODE === "true") {
    logEmitter.emit("doubleMode", "notify.connector", "sendSingleEmail");
    notifyClient = notifyClientDouble;
  } else {
    notifyClient = new NotifyClient(NOTIFY_KEY);
  }

  try {
    flattenedData.link_to_document = pdfFile
      ? await notifyClient.prepareUpload(pdfFile)
      : "";

    const notifyTemplate = await notifyClient.getTemplateById(templateId);

    const requiredTemplateFields = Object.keys(
      notifyTemplate.body.personalisation
    );

    const templateFieldsWithoutSuffix = requiredTemplateFields.map(
      fieldName => {
        const trimmedFieldName = fieldName.trim();
        return trimmedFieldName.endsWith("_exists")
          ? trimmedFieldName.slice(0, -7)
          : trimmedFieldName;
      }
    );

    const templateFieldsWithoutDuplicates = new Set(
      templateFieldsWithoutSuffix
    );

    const allNotifyPersonalisationData = { ...flattenedData };

    templateFieldsWithoutDuplicates.forEach(fieldName => {
      if (allNotifyPersonalisationData[fieldName]) {
        allNotifyPersonalisationData[`${fieldName}_exists`] = "yes";
      } else {
        allNotifyPersonalisationData[fieldName] = "";
        allNotifyPersonalisationData[`${fieldName}_exists`] = "no";
      }
    });

    const notifyArguments = [
      templateId,
      recipientEmail,
      { personalisation: allNotifyPersonalisationData }
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
