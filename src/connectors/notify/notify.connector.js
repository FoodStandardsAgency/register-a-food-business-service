const { NotifyClient } = require("notifications-node-client");
const { NOTIFY_KEY } = require("../../config");
const { logEmitter, ERROR, WARN, INFO } = require("../../services/logging.service");

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
  emailReplyToId,
  flattenedData,
  pdfFile,
  fsaId = "n/a",
  type = "n/a",
  index = "n/a"
) => {
  logEmitter.emit("functionCall", "notify.connector", "sendSingleEmail");
  let notifyClient;

  notifyClient = new NotifyClient(NOTIFY_KEY);

  try {
    flattenedData.link_to_file = pdfFile
      ? await notifyClient.prepareUpload(pdfFile, {
          confirmEmailBeforeDownload: false
        })
      : "";

    const notifyTemplate = await notifyClient.getTemplateById(templateId);

    const requiredTemplateFields = Object.keys(notifyTemplate.data.personalisation);

    const templateFieldsWithoutSuffix = requiredTemplateFields.map((fieldName) => {
      const trimmedFieldName = fieldName.trim();
      return trimmedFieldName.endsWith("_exists")
        ? trimmedFieldName.slice(0, -7)
        : trimmedFieldName;
    });

    const templateFieldsWithoutDuplicates = new Set(templateFieldsWithoutSuffix);

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

    let options = {
      personalisation: allNotifyPersonalisationData
    };

    if (emailReplyToId) {
      options["emailReplyToId"] = emailReplyToId;
    }

    const notifyResponse = await notifyClient.sendEmail(templateId, recipientEmail, options);
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

    if (
      err?.response?.status == 400 &&
      process.env.NODE_ENV !== "production" &&
      err?.response?.data?.errors?.some((e) => e.message.includes("using a team-only API key"))
    ) {
      // Where API doesn't send email in staging due to non-whitelisted address, mark as sent anyway
      logEmitter.emit(WARN, "Non-whitelisted email not sent but will be logged as successful");
      return true;
    }

    logEmitter.emit("functionFail", "notify.connector", "sendSingleEmail", newError);
    return null;
  }
};

module.exports = { sendSingleEmail };
