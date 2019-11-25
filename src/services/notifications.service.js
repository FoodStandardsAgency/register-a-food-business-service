/**
 * Functions for transforming the data and sending notifications using Notify
 * @module services/notifications
 */

const moment = require("moment");
const { logEmitter } = require("./logging.service");
const { statusEmitter } = require("./statusEmitter.service");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const { pdfGenerator, transformDataForPdf } = require("./pdf.service");
const {
  addNotificationToStatus,
  updateNotificationOnSent
} = require("../connectors/cacheDb/cacheDb.connector");

/**
 * Function that converts the data into format for Notify and creates a new object
 *
 * @param {object} registration The object containing all the answers the user has submitted during the sesion
 * @param {object} postRegistrationMetaData The object containing all the metadata from the submission e.g. fsa-rn number, submission time
 * @param {object} lcContactConfig The object containing the local council information
 *
 * @returns {object} Object containing key-value pairs of the data needed to populate corresponding keys in notify template
 */

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

  const partners = registrationClone.establishment.operator.partners;
  delete registrationClone.establishment.operator.partners;

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
    registrationClone.declaration,
    postRegistrationMetadataClone,
    lcInfo
  );

  if (Array.isArray(partners)) {
    const partnershipDetails = {
      partner_names: transformPartnersForNotify(partners),
      main_contact: getMainPartnershipContactName(partners)
    };
    Object.assign(flattenedData, { ...partnershipDetails });
  }

  return flattenedData;
};

/**
 * Function that uses Notify to send passed in emails  with the relevant data. It also uses the pdfmake generator to pipe the base64pdf to Notify.
 *
 * @param {object} emailsToSend The object containing all emails to be sent. Should include, type, address and template.
 * @param {object} registration The object containing all the answers the user has submitted during the sesion
 * @param {object} postRegistrationMetaData The object containing the metadata from the submission i.e. fsa-rn number and submission date
 * @param {object} lcContactConfig The object containing the local council information
 *
 * @returns {object} Object that returns email sent status and recipients email address
 */

const sendEmails = async (
  emailsToSend,
  registration,
  postRegistrationMetadata,
  lcContactConfig
) => {
  logEmitter.emit("functionCall", "registration.service", "sendEmails");

  let newError;
  let success = true;
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
    const pdfFile = await pdfGenerator(dataForPDF);

    for (let index in emailsToSend) {
      let fileToSend = undefined;
      if (emailsToSend[index].type === "LC") {
        fileToSend = pdfFile;
      }

      if (
        await sendSingleEmail(
          emailsToSend[index].templateId,
          emailsToSend[index].address,
          data,
          fileToSend
        )
      ) {
        await updateNotificationOnSent(
          postRegistrationMetadata["fsa-rn"],
          emailsToSend[index].type,
          emailsToSend[index].address
        );
      } else {
        success = false;
      }
    }
    if (!success) {
      newError = new Error("sendSingleEmail error");
      newError.message = "An email has failed to send";
    }
  } catch (err) {
    success = false;
    logEmitter.emit("functionFail", "registration.service", "sendEmails", err);
  }

  if (success) {
    statusEmitter.emit("incrementCount", "emailNotificationsSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      true
    );
    logEmitter.emit("functionSuccess", "registration.service", "sendEmails");
  } else {
    statusEmitter.emit("incrementCount", "emailNotificationsFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      false
    );
    if (newError) {
      logEmitter.emit(
        "functionFail",
        "registration.service",
        "sendEmails",
        newError
      );
    }
  }
};

/**
 * Function that calls the sendSingleEmail function with the relevant parameters in the right order
 *
 * @param {object} lcContactConfig The object containing the local council information
 * @param {object} registration The object containing all the answers the user has submitted during the sesion
 * @param {object} postRegistrationMetaData The object containing the metadata from the submission i.e. fsa-rn number and submission date
 * @param {object} configData Object containing notify_template_keys and future_delivery_email
 */
const sendNotifications = async (
  lcContactConfig,
  registration,
  postRegistrationMetadata,
  configData
) => {
  let emailsToSend = [];

  for (let typeOfCouncil in lcContactConfig) {
    const lcNotificationEmailAddresses =
      lcContactConfig[typeOfCouncil].local_council_notify_emails;

    for (let recipientEmailAddress in lcNotificationEmailAddresses) {
      emailsToSend.push({
        type: "LC",
        address: lcNotificationEmailAddresses[recipientEmailAddress],
        templateId: configData.notify_template_keys.lc_new_registration
      });
    }
  }

  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  emailsToSend.push({
    type: "FBO",
    address: fboEmailAddress,
    templateId: configData.notify_template_keys.fbo_submission_complete
  });

  if (registration.declaration.feedback1) {
    emailsToSend.push({
      type: "FBO_FB",
      address: fboEmailAddress,
      templateId: configData.notify_template_keys.fbo_feedback
    });

    emailsToSend.push({
      type: "FD_FB",
      address: configData.future_delivery_email,
      templateId: configData.notify_template_keys.fd_feedback
    });
  }

  await addNotificationToStatus(
    postRegistrationMetadata["fsa-rn"],
    emailsToSend
  );

  await sendEmails(
    emailsToSend,
    registration,
    postRegistrationMetadata,
    lcContactConfig
  );
};

/**
 * Converts partners array to string
 *
 * @param {array} partners partner objects
 *
 * @returns Comma-separated partner names
 */
const transformPartnersForNotify = partners => {
  const partnerNames = [];
  for (let partner in partners) {
    partnerNames.push(partners[partner].partner_name);
  }
  return partnerNames.join(", ");
};

/**
 * Extracts main partnership contact from partners list
 *
 * @param {Array} partners partner objects
 *
 * @returns Name of main partnership contact
 */
const getMainPartnershipContactName = partners => {
  const mainPartnershipContact = partners.find(partner => {
    return partner.partner_is_primary_contact === true;
  });
  return mainPartnershipContact.partner_name;
};

module.exports = { transformDataForNotify, sendNotifications };
