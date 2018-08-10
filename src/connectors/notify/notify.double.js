const {
  NOTIFY_TEMPLATE_ID_TEST,
  NOTIFY_TEMPLATE_ID_FBO,
  NOTIFY_TEMPLATE_ID_LC
} = require("../../config");

const notifyClientDouble = {
  sendEmail: (templateId, recipientEmail, options) => {
    return new Promise((resolve, reject) => {
      if (
        templateId &&
        recipientEmail &&
        options.personalisation.test_variable
      ) {
        if (recipientEmail === "fsatestemail.valid@gmail.com") {
          if (
            templateId === NOTIFY_TEMPLATE_ID_TEST ||
            templateId === NOTIFY_TEMPLATE_ID_FBO ||
            templateId === NOTIFY_TEMPLATE_ID_LC
          ) {
            resolve({ body: { id: "123-456" } });
          } else {
            reject(
              `notify.double: reject: template ID ${templateId} not supported by double`
            );
          }
        } else {
          reject(
            `notify.double: reject: recipientEmail ${recipientEmail} not supported by double`
          );
        }
      } else {
        reject(
          "notify.double: reject: missing argument or test_variable not provided in data"
        );
      }
    });
  }
};

module.exports = { notifyClientDouble };
