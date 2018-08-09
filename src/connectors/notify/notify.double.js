const localCouncilEmailTemplateID = "ecd52876-d5b0-41a0-af2b-7ac220f96625";
const fboEmailTemplateID = "a23a8e80-9a63-4140-ad27-3cec68489fd0";
const contractTestTemplateId = "e1465fad-9f95-475a-9e38-0603d1341e8c";

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
            templateId === localCouncilEmailTemplateID ||
            templateId === fboEmailTemplateID ||
            templateId === contractTestTemplateId
          ) {
            resolve({ id: "ID exists" });
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
