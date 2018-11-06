const moment = require("moment");
const { logEmitter } = require("./logging.service");
const { statusEmitter } = require("./statusEmitter.service");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const { pdfGenerator, transformDataForPdf } = require("./pdf.service");

const transformDataForNotify = (
  registration,
  postRegistrationMetadata,
  lcContactConfig
) => {
  const lcInfo = {};
  if (Object.keys(lcContactConfig).length === 1) {
    lcInfo.local_council = lcContactConfig.hygieneAndStandards.local_council;

    lcInfo.local_council_email =
      lcContactConfig.hygieneAndStandards.local_council_email;

    if (lcContactConfig.hygieneAndStandards.local_council_phone_number) {
      lcInfo.local_council_phone_number =
        lcContactConfig.hygieneAndStandards.local_council_phone_number;
    }
  } else {
    lcInfo.local_council_hygiene = lcContactConfig.hygiene.local_council;

    lcInfo.local_council_email_hygiene =
      lcContactConfig.hygiene.local_council_email;

    if (lcContactConfig.hygiene.local_council_phone_number) {
      lcInfo.local_council_phone_number_hygiene =
        lcContactConfig.hygiene.local_council_phone_number;
    }
    lcInfo.local_council_standards = lcContactConfig.standards.local_council;

    lcInfo.local_council_email_standards =
      lcContactConfig.standards.local_council_email;

    if (lcContactConfig.standards.local_council_phone_number) {
      lcInfo.local_council_phone_number_standards =
        lcContactConfig.standards.local_council_phone_number;
    }
  }

  const registrationClone = JSON.parse(JSON.stringify(registration));

  registrationClone.establishment.establishment_details.establishment_opening_date = moment(
    registrationClone.establishment.establishment_details
      .establishment_opening_date
  ).format("DD MMM YYYY");

  const postRegistrationMetadataClone = JSON.parse(
    JSON.stringify(postRegistrationMetadata)
  );

  postRegistrationMetadataClone.reg_submission_date = moment(
    postRegistrationMetadataClone.reg_submission_date
  ).format("DD MMM YYYY");

  const flattenedData = Object.assign(
    {},
    registrationClone.establishment.premise,
    registrationClone.establishment.establishment_details,
    registrationClone.establishment.operator,
    registrationClone.establishment.activities,
    registrationClone.metadata,
    postRegistrationMetadataClone,
    lcInfo
  );

  return flattenedData;
};

const sendEmailOfType = async (
  typeOfEmail,
  registration,
  postRegistrationMetadata,
  lcContactConfig,
  recipientEmailAddress,
  notifyTemplateKeys
) => {
  logEmitter.emit("functionCall", "registration.service", "sendEmailOfType");

  const emailSent = { success: undefined, recipient: recipientEmailAddress };

  let templateId;

  if (typeOfEmail === "LC") {
    templateId = notifyTemplateKeys.lc_new_registration;
  }
  if (typeOfEmail === "FBO") {
    templateId = notifyTemplateKeys.fbo_submission_complete;
  }

  try {
    const data = transformDataForNotify(
      registration,
      postRegistrationMetadata,
      lcContactConfig
    );

    const dataForPDF = transformDataForPdf(
      registration,
      postRegistrationMetadata,
      lcContactConfig
    );

    let pdfFile = undefined;
    if (typeOfEmail === "LC") {
      pdfFile = await pdfGenerator(dataForPDF);
    }

    await sendSingleEmail(templateId, recipientEmailAddress, data, pdfFile);
    emailSent.success = true;

    statusEmitter.emit("incrementCount", "emailNotificationsSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "sendEmailOfType"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "emailNotificationsFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "sendEmailOfType",
      err
    );
    throw err;
  }
  return emailSent;
};

const sendNotifications = async (
  lcContactConfig,
  registration,
  postRegistrationMetadata,
  notifyTemplateKeys
) => {
  for (let typeOfCouncil in lcContactConfig) {
    const lcNotificationEmailAddresses =
      lcContactConfig[typeOfCouncil].local_council_notify_emails;

    for (let recipientEmailAddress in lcNotificationEmailAddresses) {
      await sendEmailOfType(
        "LC",
        registration,
        postRegistrationMetadata,
        lcContactConfig,
        lcNotificationEmailAddresses[recipientEmailAddress],
        notifyTemplateKeys
      );
    }
  }

  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  await sendEmailOfType(
    "FBO",
    registration,
    postRegistrationMetadata,
    lcContactConfig,
    fboEmailAddress,
    notifyTemplateKeys
  );
};

module.exports = { transformDataForNotify, sendNotifications };
