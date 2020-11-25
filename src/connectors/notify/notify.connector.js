const { NotifyClient } = require("notifications-node-client");
const { notifyClientDouble } = require("./notify.double");
const { NOTIFY_KEY } = require("../../config");
const { logEmitter, ERROR, INFO } = require("../../services/logging.service");

const sendStatusEmail = async (templateId, recipientEmail, flattenedData) => {
  logEmitter.emit("functionCall", "notify.connector", "sendStatusEmail");

  let notifyClient;

  if (
    process.env.NOTIFY_DOUBLE_MODE === "true" ||
    process.env.DOUBLE_MODE === "true"
  ) {
    logEmitter.emit("doubleMode", "notify.connector", "sendStatusEmail");
    notifyClient = notifyClientDouble;
  } else {
    notifyClient = new NotifyClient(NOTIFY_KEY);
  }

  try {
    const notifyTemplate = await notifyClient.getTemplateById(templateId);

    const requiredTemplateFields = Object.keys(
      notifyTemplate.body.personalisation
    );

    const templateFieldsWithoutSuffix = requiredTemplateFields.map(
      (fieldName) => {
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

    templateFieldsWithoutDuplicates.forEach((fieldName) => {
      if (allNotifyPersonalisationData[fieldName]) {
        allNotifyPersonalisationData[`${fieldName}_exists`] = "yes";
      } else {
        allNotifyPersonalisationData[fieldName] = "";
        allNotifyPersonalisationData[`${fieldName}_exists`] = "no";
      }
    });

    if (allNotifyPersonalisationData.country == "england") {
      allNotifyPersonalisationData["england"] = "yes";
    } else if (allNotifyPersonalisationData.country == "wales") {
      allNotifyPersonalisationData["wales"] = "yes";
    } else if (allNotifyPersonalisationData.country == "northern-ireland") {
      allNotifyPersonalisationData["northern-ireland"] = "yes";
    }

    const notifyArguments = [
      templateId,
      recipientEmail,
      { personalisation: allNotifyPersonalisationData }
    ];

    const notifyResponse = await notifyClient.sendEmail(...notifyArguments);
    const responseBody = notifyResponse.body;
    logEmitter.emit("functionSuccess", "notify.connector", "sendStatusEmail");
    return responseBody;
  } catch (err) {
    logEmitter.emit(ERROR, `Send email failed with error`);

    const newError = new Error("Notify error");
    newError.message = err.message;
    if (err.message === "secretOrPrivateKey must have a value") {
      newError.name = "notifyMissingKey";
    }
    if (err.statusCode === 400) {
      if (err.error.errors[0].error === "ValidationError") {
        newError.name = "notifyInvalidTemplate";
      }
      if (err.error.errors[0].error === "BadRequestError") {
        newError.name = "notifyMissingPersonalisation";
      }
    }
    logEmitter.emit(
      "functionFail",
      "notify.connector",
      "sendStatusEmail",
      newError
    );
    return null;
  }
};

/**
 * Send a single email
 * @param {string} templateId The template Id for the relevant email in notify
 * @param {string} recipientEmail The email address for notifaction to be sent to
 * @param {object} flattenedData The data for the template properties
 * @param {object} pdfFile The pdf file to be sent with email
 * @param fsaId
 * @param type
 * @param index
 */
const sendSingleEmail = async (
  templateId,
  recipientEmail,
  flattenedData,
  pdfFile,
  fsaId = "n/a",
  type = "n/a",
  index = "n/a"
) => {
  logEmitter.emit("functionCall", "notify.connector", "sendSingleEmail");
  let notifyClient;

  if (
    process.env.NOTIFY_DOUBLE_MODE === "true" ||
    process.env.DOUBLE_MODE === "true"
  ) {
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
      (fieldName) => {
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

    templateFieldsWithoutDuplicates.forEach((fieldName) => {
      if (allNotifyPersonalisationData[fieldName]) {
        allNotifyPersonalisationData[`${fieldName}_exists`] = "yes";
      } else {
        allNotifyPersonalisationData[fieldName] = "";
        allNotifyPersonalisationData[`${fieldName}_exists`] = "no";
      }
    });

    if (allNotifyPersonalisationData.country == "england") {
      allNotifyPersonalisationData["england"] = "yes";
    } else if (allNotifyPersonalisationData.country == "wales") {
      allNotifyPersonalisationData["wales"] = "yes";
    } else if (allNotifyPersonalisationData.country == "northern-ireland") {
      allNotifyPersonalisationData["northern-ireland"] = "yes";
    }

    allNotifyPersonalisationData[
      "establishment_postcode_FD"
    ] = allNotifyPersonalisationData.establishment_postcode
      .replace(" ", "")
      .slice(0, -3);

    const notifyArguments = [
      templateId,
      recipientEmail,
      { personalisation: allNotifyPersonalisationData }
    ];

    const notifyResponse = await notifyClient.sendEmail(...notifyArguments);
    const responseBody = notifyResponse.body;
    logEmitter.emit("functionSuccess", "notify.connector", "sendSingleEmail");
    logEmitter.emit(
      INFO,
      `Sent email successfully for fsaID ${fsaId} for type ${type} index: ${index}`
    );
    return responseBody;
  } catch (err) {
    logEmitter.emit(
      ERROR,
      `Send email failed with error for fsaID ${fsaId} for type ${type} index: ${index}`
    );

    const newError = new Error(`Notify error for FSAId: ${fsaId}`);
    newError.message = err.message;
    if (err.message === "secretOrPrivateKey must have a value") {
      newError.name = "notifyMissingKey";
    }
    if (err.statusCode === 400) {
      if (err.error.errors[0].error === "ValidationError") {
        newError.name = "notifyInvalidTemplate";
      }
      if (err.error.errors[0].error === "BadRequestError") {
        if (
          process.env.NODE_ENV !== "production" &&
          err.message.includes("using a team-only API key")
        ) {
          // Where API doesn't send email in staging due to non-whitelisted address, mark as sent anyway
          return true;
        }
        newError.name = "notifyMissingPersonalisation";
      }
    }
    logEmitter.emit(
      "functionFail",
      "notify.connector",
      "sendSingleEmail",
      newError
    );
    return null;
  }
};

module.exports = { sendSingleEmail, sendStatusEmail };
