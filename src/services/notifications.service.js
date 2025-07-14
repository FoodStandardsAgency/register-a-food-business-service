/**
 * Functions for transforming the data and sending notifications using Notify
 * @module services/notifications
 */

const moment = require("moment");
const { logEmitter, WARN, ERROR, INFO } = require("./logging.service");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const { pdfGenerator, transformDataForPdf } = require("./pdf.service");
const {
  FBO_SUBMISSION_COMPLETE_TEMPLATE_ID,
  LC_NEW_REGISTRATION_TEMPLATE_ID,
  FBO_FEEDBACK_TEMPLATE_ID,
  FD_FEEDBACK_TEMPLATE_ID,
  RNG_PENDING_TEMPLATE_ID,
  FBO_SUBMISSION_COMPLETE_TEMPLATE_ID_CY,
  LC_NEW_REGISTRATION_TEMPLATE_ID_CY,
  FBO_FEEDBACK_TEMPLATE_ID_CY,
  RNG_PENDING_TEMPLATE_ID_CY,
  FUTURE_DELIVERY_EMAIL
} = require("../config");
const {
  getStatus,
  updateStatus,
  updateNotificationOnSent
} = require("../connectors/notificationsDb/notificationsDb.connector");
const { has, isArrayLikeObject } = require("lodash");
const { transformEnumsForService } = require("./transformEnums.service");
const i18n = require("../utils/i18n/i18n");
const { establishConnectionToCosmos } = require("../connectors/cosmos.client");
const NOTIFICATION_STATUS_SUCCESS = "Updating notifications status success";
const NOTIFICATION_STATUS_FAILURE = "Updating notifications status failure";

/**
 * Function that converts the data into format for Notify and creates a new object
 *
 * @param {object} registration The cached registration
 * @param {object} lcContactConfig The object containing the local council information
 * @param {object} i18n The translation util
 *
 * @returns {object} Object containing key-value pairs of the data needed to populate corresponding keys in notify template
 */

const transformDataForNotify = (registration, lcContactConfig, i18n) => {
  const lcInfo = {};
  if (lcContactConfig.hygieneAndStandards) {
    lcInfo.local_council = i18n.tLa(
      lcContactConfig.hygieneAndStandards.new_authority_name ||
        lcContactConfig.hygieneAndStandards.local_council
    );

    lcInfo.local_council_email = lcContactConfig.hygieneAndStandards.local_council_email;

    lcInfo.country = lcContactConfig.hygieneAndStandards.country;

    lcInfo.hasAuth = lcContactConfig.hygieneAndStandards.hasAuth;

    if (lcContactConfig.hygieneAndStandards.local_council_phone_number) {
      lcInfo.local_council_phone_number =
        lcContactConfig.hygieneAndStandards.local_council_phone_number;
    }
    if (lcContactConfig.hygieneAndStandards.local_council_guidance_link) {
      lcInfo.local_council_guidance_link =
        lcContactConfig.hygieneAndStandards.local_council_guidance_link;
    }
  } else {
    lcInfo.local_council_hygiene = i18n.tLa(
      lcContactConfig.hygiene.new_authority_name || lcContactConfig.hygiene.local_council
    );

    lcInfo.local_council_email_hygiene = lcContactConfig.hygiene.local_council_email;

    lcInfo.country = lcContactConfig.hygiene.country;

    lcInfo.hasAuth = lcContactConfig.hygiene.hasAuth;

    if (lcContactConfig.hygiene.local_council_phone_number) {
      lcInfo.local_council_phone_number_hygiene =
        lcContactConfig.hygiene.local_council_phone_number;
    }
    if (lcContactConfig.hygiene.local_council_guidance_link) {
      lcInfo.local_council_guidance_link_hygiene =
        lcContactConfig.hygiene.local_council_guidance_link;
    }
    lcInfo.local_council_standards = i18n.tLa(
      lcContactConfig.standards.new_authority_name || lcContactConfig.standards.local_council
    );

    lcInfo.local_council_email_standards = lcContactConfig.standards.local_council_email;

    if (lcContactConfig.standards.local_council_phone_number) {
      lcInfo.local_council_phone_number_standards =
        lcContactConfig.standards.local_council_phone_number;
    }

    if (lcContactConfig.standards.local_council_guidance_link) {
      lcInfo.local_council_guidance_link_standards =
        lcContactConfig.standards.local_council_guidance_link;
    }
  }
  const registrationClone = JSON.parse(JSON.stringify(registration));

  const partners = registrationClone.establishment.operator.partners;
  const tradingNames =
    registrationClone.establishment.establishment_details.establishment_additional_trading_names;
  delete registrationClone.establishment.operator.partners;
  delete registrationClone.establishment.operator.operator_first_line;
  delete registrationClone.establishment.operator.operator_street;
  delete registrationClone.establishment.premise.establishment_first_line;
  delete registrationClone.establishment.premise.establishment_street;

  moment.locale(registration.submission_language ? registration.submission_language : "en");
  registrationClone.establishment.establishment_details.establishment_opening_date = moment(
    registrationClone.establishment.establishment_details.establishment_opening_date
  ).format("DD MMM YYYY");

  registrationClone.reg_submission_date = moment(registrationClone.reg_submission_date).format(
    "DD MMM YYYY"
  );

  if (registrationClone.establishment.operator.operator_birthdate) {
    registrationClone.establishment.operator.operator_birthdate = moment(
      registrationClone.establishment.operator.operator_birthdate
    ).format("DD MMM YYYY");
  }

  if (Array.isArray(tradingNames)) {
    registrationClone.establishment.establishment_details.establishment_additional_trading_names =
      transformTradingNamesForNotify(tradingNames);
  }

  let flattenedData = Object.assign(
    {},
    registrationClone.establishment.premise,
    registrationClone.establishment.establishment_details,
    registrationClone.establishment.operator,
    registrationClone.establishment.activities,
    registrationClone.declaration,
    {
      reg_submission_date: registrationClone.reg_submission_date
    },
    lcInfo
  );

  delete registrationClone.establishment;
  delete registrationClone.declaration;

  flattenedData = Object.assign({}, flattenedData, registrationClone);

  if (Array.isArray(partners)) {
    const partnershipDetails = {
      partner_names: transformPartnersForNotify(partners),
      main_contact: getMainPartnershipContactName(partners)
    };
    Object.assign(flattenedData, { ...partnershipDetails });
  }

  flattenedData.establishment_postcode_FD = flattenedData.establishment_postcode
    .replace(" ", "")
    .slice(0, -3);
  transformEnumsForService(flattenedData, registration.submission_language);
  flattenedData.declaration1 = i18n.t(flattenedData.declaration1);
  flattenedData.declaration2 = i18n.t(flattenedData.declaration2);
  flattenedData.declaration3 = i18n.t(flattenedData.declaration3);

  return flattenedData;
};

/**
 * Function that uses Notify to send passed in emails  with the relevant data. It also uses the pdfmake generator to pipe the base64pdf to Notify.
 *
 * @param {object} emailsToSend The object containing all emails to be sent. Should include, type, address and template.
 * @param {object} registration The object containing all the answers the user has submitted during the sesion
 * @param fsaId
 * @param {object} lcContactConfig The object containing the local council information
 *
 * @returns {object} Object that returns email sent status and recipients email address
 */

const sendEmails = async (emailsToSend, registration, fsaId, lcContactConfig) => {
  logEmitter.emit("functionCall", "notifications.service", "sendEmails");
  logEmitter.emit(INFO, `Started sendEmails for FSAid: ${fsaId}`);

  let success = true;
  let lastSentStatus;
  let cachedRegistrations = await establishConnectionToCosmos("registrations", "registrations");
  let status = await getStatus(cachedRegistrations, fsaId);

  try {
    if (emailsToSend.length === 0) {
      //no emails to send - we dont expect this to ever happen
      logEmitter.emit(WARN, `There were no entries in the emailsToSend for FSAid ${fsaId}`);

      //it worked on basis that there was nothing to send
      return true;
    }

    //we need to check the status immediately to identify that it is what we expect on the length of emailsToSend - shouldnt happen
    if (
      !(status.notifications.length === 0 || status.notifications.length === emailsToSend.length)
    ) {
      throw new Error(
        `The notifications array and emails to send do not match and could indicate corruption - fsaId ${fsaId}`
      );
    }

    let i18nUtil = new i18n(registration.submission_language || "en");
    const data = transformDataForNotify(registration, lcContactConfig, i18nUtil);
    const dataForPDF = transformDataForPdf(registration, lcContactConfig);
    const pdfFile = await pdfGenerator(dataForPDF, i18nUtil);

    for (let index in emailsToSend) {
      let fileToSend = undefined;
      if (emailsToSend[index].type === "LC") {
        fileToSend = pdfFile;
      }

      if (status.notifications[index].sent === true) {
        logEmitter.emit(
          INFO,
          `Skipping email send (already sent) - type: ${emailsToSend[index].type} index:${index} for FSAId ${fsaId}`
        );

        continue;
      }

      // Checking if registration has a No reply email set up and edits notify template
      if (emailsToSend[index].type === "FBO" && emailsToSend[index].emailReplyToId) {
        data.noReply = false;
      } else {
        data.noReply = true;
      }

      lastSentStatus =
        (await sendSingleEmail(
          emailsToSend[index].templateId,
          emailsToSend[index].address,
          emailsToSend[index].emailReplyToId,
          data,
          fileToSend,
          fsaId,
          emailsToSend[index].type,
          index
        )) !== null;
      success = success && lastSentStatus === true;

      updateNotificationOnSent(status, fsaId, emailsToSend, index, lastSentStatus);

      logEmitter.emit(
        INFO,
        `Attempted email sent with sendStatus: ${lastSentStatus ? "sent" : "failed"} type: ${
          emailsToSend[index].type
        } index:${index} for FSAId ${fsaId}`
      );
    }
  } catch (err) {
    success = false;

    logEmitter.emit(ERROR, `There was an error sending emails for FSAId ${fsaId}`);
    logEmitter.emit(ERROR, `Email error FSAId ${fsaId}: ${err.toString()}`);
  }

  try {
    await updateStatus(cachedRegistrations, fsaId, status);

    logEmitter.emit(INFO, NOTIFICATION_STATUS_SUCCESS); // Used for Azure alerts
  } catch (err) {
    logEmitter.emit(WARN, NOTIFICATION_STATUS_FAILURE); // Used for Azure alerts
  }

  if (success) {
    logEmitter.emit(INFO, "Email notification success"); // Used for Azure alerts
    logEmitter.emit("functionSuccess", "notifications.service", "sendEmails");
  } else {
    logEmitter.emit(WARN, "Email notification failure"); // Used for Azure alerts
    logEmitter.emit("functionFail", "notifications.service", "sendEmails");
  }
};

/**
 * Function that calls the sendSingleEmail function with the relevant parameters in the right order
 *
 * @param fsaId
 * @param {object} lcContactConfig The object containing the local council information
 * @param {object} registration The object containing all the answers the user has submitted during the sesion
 */
const sendNotifications = async (fsaId, lcContactConfig, registration) => {
  let emailsToSend = generateEmailsToSend(registration, lcContactConfig);

  await initialiseNotificationsStatusIfNotSet(fsaId, emailsToSend);

  await sendEmails(emailsToSend, registration, fsaId, lcContactConfig);
};

const initialiseNotificationsStatus = (emailsToSend) => {
  let notifications = [];

  for (let index in emailsToSend) {
    notifications.push({
      time: undefined,
      sent:
        emailsToSend.length > 1 && emailsToSend[index].type === "RNG_PENDING" // In order to prevent RN pending emails from being sent to FBO when RNG service has been resolved
          ? true
          : false,
      type: emailsToSend[index].type,
      address: emailsToSend[index].address
    });
  }

  return notifications;
};

/**
 * Add an object to the notifications field containing the status for each email to be sent, initialises with false
 * @param fsaId
 * @param {object} emailsToSend An object containing all of the emails to be sent
 */
const initialiseNotificationsStatusIfNotSet = async (fsaId, emailsToSend) => {
  logEmitter.emit("functionCall", "notifications.service", "addNotificationToStatus");
  try {
    let cachedRegistrations = await establishConnectionToCosmos("registrations", "registrations");
    let status = await getStatus(cachedRegistrations, fsaId);

    if (has(status, "notifications") && isArrayLikeObject(status.notifications)) {
      if (status.notifications.length === emailsToSend.length) {
        logEmitter.emit(
          INFO,
          `Not initialising notifications hash - its the same length as emailsToSend - FSAId ${fsaId}`
        );
        return;
      } else {
        logEmitter.emit(
          INFO,
          `Reintialising notifications status for FSAId ${fsaId} - 
            the length doesnt match emails to send (${status.notifications.length}) (${emailsToSend.length}) `
        );
      }
    }

    status.notifications = initialiseNotificationsStatus(emailsToSend);
    logEmitter.emit(
      INFO,
      `Initialising notifications status for FSAId ${fsaId}: ${emailsToSend.length} emails to send`
    );
    await updateStatus(cachedRegistrations, fsaId, status);

    logEmitter.emit(INFO, NOTIFICATION_STATUS_SUCCESS); // Used for Azure alerts
    logEmitter.emit(
      "functionSuccess",
      "notifications.service",
      "initialiseNotificationsStatusIfNotSet"
    );
  } catch (err) {
    logEmitter.emit(WARN, NOTIFICATION_STATUS_FAILURE); // Used for Azure alerts
    logEmitter.emit(
      "functionFail",
      "notifications.service",
      "initialiseNotificationsStatusIfNotSet",
      err
    );
  }
};

const generateEmailsToSend = (registration, lcContactConfig) => {
  const cy = registration.submission_language === "cy";
  let emailsToSend = [];
  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  if (
    (registration.status &&
      registration.status.notifications &&
      registration.status.notifications.length > 1) ||
    (registration.status &&
      registration.status.notifications &&
      registration.status.notifications.length == 1 &&
      registration.status.notifications[0].type != "RNG_PENDING")
  ) {
    // use existing notifications
    registration.status.notifications.forEach((notification) => {
      let templateID;
      switch (notification.type) {
        case "LC":
          templateID = cy ? LC_NEW_REGISTRATION_TEMPLATE_ID_CY : LC_NEW_REGISTRATION_TEMPLATE_ID;
          break;
        case "FBO":
          templateID = cy
            ? FBO_SUBMISSION_COMPLETE_TEMPLATE_ID_CY
            : FBO_SUBMISSION_COMPLETE_TEMPLATE_ID;
          break;
        case "FBO_FB":
          templateID = cy ? FBO_FEEDBACK_TEMPLATE_ID_CY : FBO_FEEDBACK_TEMPLATE_ID;
          break;
        case "FD_FB":
          templateID = FD_FEEDBACK_TEMPLATE_ID;
          break;
        case "RNG_PENDING":
          templateID = cy ? RNG_PENDING_TEMPLATE_ID_CY : RNG_PENDING_TEMPLATE_ID;
      }
      let emailToSend = {
        type: notification.type,
        address: notification.address,
        templateId: templateID
      };
      if (notification.type === "FBO" && lcContactConfig.emailReplyToId) {
        emailToSend["emailReplyToId"] = lcContactConfig.emailReplyToId;
      }
      emailsToSend.push(emailToSend);
    });
  } else if (registration["fsa-rn"].startsWith("tmp_")) {
    // send only RNG pending notification
    emailsToSend.push({
      type: "RNG_PENDING",
      address: fboEmailAddress,
      templateId: cy ? RNG_PENDING_TEMPLATE_ID_CY : RNG_PENDING_TEMPLATE_ID
    });
  } else {
    // create new notifications
    if (
      registration.status &&
      registration.status.notifications &&
      registration.status.notifications.length == 1 &&
      registration.status.notifications[0].type == "RNG_PENDING"
    ) {
      emailsToSend.push({
        type: "RNG_PENDING",
        address: fboEmailAddress,
        templateId: cy ? RNG_PENDING_TEMPLATE_ID_CY : RNG_PENDING_TEMPLATE_ID
      });
    }

    for (let typeOfCouncil in lcContactConfig) {
      const lcNotificationEmailAddresses =
        lcContactConfig[typeOfCouncil].local_council_notify_emails;

      for (let recipientEmailAddress in lcNotificationEmailAddresses) {
        emailsToSend.push({
          type: "LC",
          address: lcNotificationEmailAddresses[recipientEmailAddress],
          templateId: cy ? LC_NEW_REGISTRATION_TEMPLATE_ID_CY : LC_NEW_REGISTRATION_TEMPLATE_ID
        });
      }
    }

    let emailToSend = {
      type: "FBO",
      address: fboEmailAddress,
      templateId: cy ? FBO_SUBMISSION_COMPLETE_TEMPLATE_ID_CY : FBO_SUBMISSION_COMPLETE_TEMPLATE_ID
    };

    if (lcContactConfig.emailReplyToId) {
      emailToSend["emailReplyToId"] = lcContactConfig.emailReplyToId;
    }

    emailsToSend.push(emailToSend);

    if (registration.declaration && registration.declaration.feedback1) {
      emailsToSend.push({
        type: "FBO_FB",
        address: fboEmailAddress,
        templateId: cy ? FBO_FEEDBACK_TEMPLATE_ID_CY : FBO_FEEDBACK_TEMPLATE_ID
      });

      emailsToSend.push({
        type: "FD_FB",
        address: FUTURE_DELIVERY_EMAIL,
        templateId: FD_FEEDBACK_TEMPLATE_ID
      });
    }
  }

  return emailsToSend;
};

/**
 * Converts partners array to string
 *
 * @param {array} partners partner objects
 *
 * @returns Comma-separated partner names
 */
const transformPartnersForNotify = (partners) => {
  const partnerNames = [];
  for (let partner in partners) {
    partnerNames.push(partners[partner].partner_name);
  }
  return partnerNames.join(", ");
};

/**
 * Converts trading names array to string
 * @param {array} tradingNames trading names array
 * @returns {string} Comma-separated trading names
 */
const transformTradingNamesForNotify = (tradingNames) => {
  // Add bullet points to each trading name and join them with a new line
  return tradingNames.map((name) => `* ${name}`).join("\n");
};

/**
 * Extracts main partnership contact from partners list
 *
 * @param {Array} partners partner objects
 *
 * @returns Name of main partnership contact
 */
const getMainPartnershipContactName = (partners) => {
  const mainPartnershipContact = partners.find((partner) => {
    return partner.partner_is_primary_contact === true;
  });
  return mainPartnershipContact.partner_name;
};

module.exports = {
  transformDataForNotify,
  sendNotifications,
  generateEmailsToSend
};
