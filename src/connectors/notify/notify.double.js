const {
  NOTIFY_TEMPLATE_ID_TEST,
  NOTIFY_TEMPLATE_ID_FBO,
  NOTIFY_TEMPLATE_ID_LC,
} = require("../../config");

const notifyClientDouble = {
  sendEmail: (templateId, recipientEmail, personalisation) => {
    return new Promise((resolve, reject) => {
      if (
        templateId &&
        recipientEmail &&
        personalisation.personalisation.establishment_trading_name
      ) {
        if (recipientEmail.includes("fsatestemail.valid@gmail.com")) {
          if (
            templateId === NOTIFY_TEMPLATE_ID_TEST ||
            templateId === NOTIFY_TEMPLATE_ID_FBO ||
            templateId === NOTIFY_TEMPLATE_ID_LC ||
            templateId === "integration-test"
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
          "notify.double: reject: missing argument or establishment_trading_name not provided in data"
        );
      }
    });
  },
  prepareUpload: () => "www.link-to-document.com",
  getTemplateById: () => ({
    body: {
      personalisation: {
        establishment_trading_name: {},
      },
    },
  }),
};

module.exports = { notifyClientDouble };
