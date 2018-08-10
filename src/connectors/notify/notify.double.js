const testTemplateID = "e1465fad-9f95-475a-9e38-0603d1341e8c";

const notifyClientDouble = {
  sendEmail: (templateId, recipientEmail, options) => {
    return new Promise((resolve, reject) => {
      if (
        templateId &&
        recipientEmail &&
        options.personalisation.test_variable
      ) {
        if (recipientEmail === "fsatestemail.valid@gmail.com") {
          if (templateId === testTemplateID) {
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
