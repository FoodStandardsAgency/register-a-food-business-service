"use strict";

/**
 * This module handles trading status checks for food business registrations.
 * It processes status updates, sends notifications, and manages registration lifecycle.
 */

const moment = require("moment");
const i18n = require("../utils/i18n/i18n");
const { INFO, WARN, ERROR, logEmitter } = require("./logging.service");
const {
  getNextActionAndDate,
  getUnsuccessfulChecks,
  getMostRecentCheck,
  getVerifiedRegistrationDates,
  getTemplateIdFromEmailType,
  generateStatusEmailToSend,
  isEmailNotificationAction
} = require("../utils/tradingStatusHelpers.js");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const {
  updateTradingStatusCheck,
  updateNextStatusDate,
  deleteRegistration
} = require("../connectors/statusChecksDb/status-checks.connector");
const { encryptId } = require("../utils/crypto");
const {
  INITIAL_REGISTRATION,
  INITIAL_CHECK,
  INITIAL_CHECK_CHASE,
  REGULAR_CHECK,
  REGULAR_CHECK_CHASE,
  CONFIRMED_TRADING,
  CONFIRMED_NOT_TRADING,
  FINISHED_TRADING_LA,
  STILL_TRADING_LA,
  DELETE_REGISTRATION,
  FRONT_END_URL
} = require("../config");

/**
 * Processes the trading status of a registration and updates the local authority configuration accordingly.
 * It checks if the registration is due for a status check, updates the status, and sends notifications.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @returns {Object} Result object with fsaId and message/error fields.
 */
const processTradingStatus = async (registration, laConfig) => {
  logEmitter.emit("functionCall", "status-checks.service", "processTradingStatus");

  // Validate registration dates
  const tradingStatusDates = getVerifiedRegistrationDates(registration);
  if (!tradingStatusDates.valid) {
    throw new Error(`Trading status checks validation error: ${tradingStatusDates.error}`);
  }

  // First, handle any previously unsuccessful email checks
  const unsuccessfulChecks = getUnsuccessfulChecks(tradingStatusDates.trading_status_checks);
  if (unsuccessfulChecks.length > 0) {
    return await handleUnsuccessfulChecks(registration, laConfig, unsuccessfulChecks);
  }

  // No unsuccessful checks, proceed with the next scheduled action
  return await handleScheduledAction(registration, tradingStatusDates, laConfig);
};

/**
 * Handles any previously unsuccessful email checks by resending them.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @param {Array} unsuccessfulChecks - Array of unsuccessful check objects.
 * @returns {Object} Result with success/error message.
 */
const handleUnsuccessfulChecks = async (registration, laConfig, unsuccessfulChecks) => {
  const fsaId = registration["fsa-rn"];
  const emailsToSend = unsuccessfulChecks.map((check) => ({
    type: check.type,
    email: check.email,
    emailReplyToId: laConfig.emailReplyToId,
    templateId: getTemplateIdFromEmailType(check.type, registration.submission_language === "cy")
  }));

  const success = await sendTradingStatusEmails(registration, laConfig, emailsToSend);

  return success
    ? { fsaId, message: "Previously unsuccessful emails sent" }
    : { fsaId, error: "At least one previously unsuccessful email failed again" };
};

/**
 * Handles the scheduled action for a registration based on its trading status.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} tradingStatusDates - Verified registration dates object.
 * @param {Object} laConfig - The local authority configuration.
 * @returns {Object} Result with action taken message.
 */
const handleScheduledAction = async (registration, tradingStatusDates, laConfig) => {
  const fsaId = registration["fsa-rn"];
  const action = getTradingStatusAction(tradingStatusDates, laConfig);

  // If no action or action time is in the future, just reschedule
  if (!action || action.time.isAfter(moment())) {
    return await rescheduleAction(fsaId, action);
  }

  // Action is due now, process it
  return await executeAction(registration, laConfig, action);
};

/**
 * Reschedules an action for future execution.
 *
 * @param {string} fsaId - The FSA registration ID.
 * @param {Object|null} action - The action object or null if no action needed.
 * @returns {Object} Result with rescheduling message.
 */
const rescheduleAction = async (fsaId, action) => {
  await updateNextStatusDate(fsaId, action?.time);

  const message = action
    ? `${action.type} rescheduled for ${action.time.format("YYYY-MM-DD HH:mm:ss")}`
    : "No action needed, next status date cleared";

  return { fsaId, message };
};

/**
 * Executes a due action based on its type.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @param {Object} action - The action object to execute.
 * @returns {Object} Result with action execution message.
 */
const executeAction = async (registration, laConfig, action) => {
  const fsaId = registration["fsa-rn"];

  // Handle registration deletion
  if (action.type === DELETE_REGISTRATION) {
    await deleteRegistration(fsaId);
    return { fsaId, message: `Registration deleted` };
  }

  // Handle action types that require email notifications
  if (isEmailNotificationAction(action.type)) {
    const emailsToSend = generateStatusEmailToSend(registration, action.type, laConfig);
    await sendTradingStatusEmails(registration, laConfig, emailsToSend);

    // Update action time to now and schedule next action
    action.time = moment();
    const nextAction = getNextActionAndDate(action, laConfig.trading_status);
    await updateNextStatusDate(fsaId, nextAction?.time);

    return {
      fsaId,
      message: `${action.type} emails sent, ${nextAction.type} scheduled for ${nextAction.time.format("YYYY-MM-DD HH:mm:ss")}`
    };
  }

  // Handle invalid action types
  throw new Error(`Action type not processable: ${action.type}`);
};

/**
 * Determines the next trading status action based on the registration history and LA configuration.
 * It checks if the registration is due for a status check and returns the appropriate action.
 *
 * @param {Object} tradingStatusDates - The registration object containing trading status and checks history.
 * @param {Object} laConfig - The local authority configuration containing status check interval.
 * @returns {Object} The next action object containing type and scheduled time.
 */
const getTradingStatusAction = (tradingStatusDates, laConfig) => {
  const mostRecentCheck = getMostRecentCheck(tradingStatusDates.trading_status_checks);
  return getNextActionAndDate(mostRecentCheck, laConfig.trading_status);
};

/**
 * Transforms registration data into the format required by the Notify service.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @param {string} actionType - The type of action/email being sent.
 * @param {Object} i18nUtil - The internationalization utility.
 * @returns {Object} Formatted data object for the Notify template.
 */
const transformDataForNotify = (registration, laConfig, actionType, i18nUtil) => {
  const encryptedId = encryptId(registration._id);
  const fsaId = registration["fsa-rn"];

  // Determine status text based on action type
  const status = getStatusTextForActionType(actionType, i18nUtil);

  // Build operator name from first and last name
  const operatorFirstName = registration.establishment.operator.operator_first_name;
  const operatorLastName = registration.establishment.operator.operator_last_name;
  const operatorName = `${operatorFirstName} ${operatorLastName}`;

  // Format submission date
  const formattedSubmissionDate = moment(registration.reg_submission_date).format("DD MMM YYYY");
  const lang = registration.submission_language ?? "en";

  // Create data object for Notify template
  return {
    registration_number: fsaId,
    additional_text: status,
    la_name: i18nUtil.tLa(laConfig.local_council),
    reg_submission_date: formattedSubmissionDate,
    trading_name: registration.establishment.establishment_details.establishment_trading_name,
    operator_name: operatorName,
    trading_yes_link: `${FRONT_END_URL}tradingstatus/stilltrading/${fsaId}?token=${encryptedId}&lang=${lang}`,
    trading_no_link: `${FRONT_END_URL}tradingstatus/nolongertrading/${fsaId}?token=${encryptedId}&lang=${lang}`
  };
};

/**
 * Gets the appropriate status text for a given action type.
 *
 * @param {string} actionType - The action type.
 * @param {Object} i18nUtil - The internationalization utility.
 * @returns {string} The status text to use in notifications.
 */
const getStatusTextForActionType = (actionType, i18nUtil) => {
  switch (actionType) {
    case STILL_TRADING_LA:
      return i18nUtil.tLa("still trading");
    case FINISHED_TRADING_LA:
      return i18nUtil.tLa("no longer trading");
    case INITIAL_CHECK_CHASE:
    case REGULAR_CHECK_CHASE:
      return i18nUtil.tLa(" - reminder");
    default:
      return undefined; // No additional text needed for other action types
  }
};

/**
 * Sends emails for trading status updates and notifications to appropriate recipients.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @param {Array} emailsToSend - Array of email objects to send.
 * @returns {Promise<boolean>} Promise that resolves to true if all emails were sent successfully, false otherwise.
 */
const sendTradingStatusEmails = async (registration, laConfig, emailsToSend) => {
  const fsaId = registration["fsa-rn"];

  logEmitter.emit("functionCall", "status-checks.service", "sendTradingStatusEmails");
  logEmitter.emit(INFO, `Started sendTradingStatusEmails for FSA id: ${fsaId}`);

  // Initialize i18n utility with appropriate language
  const language = registration.submission_language || "en";
  const i18nUtil = new i18n(language);

  let allEmailsSentSuccessfully = true;

  // Send each email in sequence
  for (const emailToSend of emailsToSend) {
    const emailSent = await sendEmailAndRecordStatus(registration, laConfig, emailToSend, i18nUtil);
    if (!emailSent) {
      allEmailsSentSuccessfully = false;
    }
  }

  // Log final result for monitoring/alerts
  logFinalEmailStatus(allEmailsSentSuccessfully);

  return allEmailsSentSuccessfully;
};

/**
 * Sends a single email and records its status in the database.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 * @param {Object} emailToSend - Email configuration object.
 * @param {Object} i18nUtil - The internationalization utility.
 * @returns {Promise<boolean>} Whether the email was sent successfully.
 */
const sendEmailAndRecordStatus = async (registration, laConfig, emailToSend, i18nUtil) => {
  const fsaId = registration["fsa-rn"];
  const { address, templateId, type, emailReplyToId } = emailToSend;

  // Transform data for Notify template
  const notifyData = transformDataForNotify(registration, laConfig, type, i18nUtil);

  // Send email and capture success/failure
  // Note: sendSingleEmail returns null for failure, and undefined or true for success
  const emailResult = await sendSingleEmail(
    templateId,
    address,
    emailReplyToId,
    notifyData,
    null,
    fsaId,
    type
  );

  const emailSent = emailResult !== null;

  // Log result
  if (emailSent) {
    logEmitter.emit(INFO, `Sent ${type} email to ${address}`);
  } else {
    logEmitter.emit(ERROR, `Failed to send ${type} email to ${address}`);
  }

  // Record email status in database
  await updateTradingStatusCheck(fsaId, {
    type,
    time: moment().toDate(),
    address,
    sent: emailSent
  });

  return emailSent;
};

/**
 * Logs the final status of the email sending process.
 *
 * @param {boolean} success - Whether all emails were sent successfully.
 */
const logFinalEmailStatus = (success) => {
  if (success) {
    logEmitter.emit(INFO, "Email notification success"); // Used for Azure alerts
    logEmitter.emit("functionSuccess", "status-checks.service", "sendTradingStatusEmails");
  } else {
    logEmitter.emit(WARN, "Email notification failure"); // Used for Azure alerts
    logEmitter.emit("functionFail", "status-checks.service", "sendTradingStatusEmails");
  }
};

module.exports = {
  processTradingStatus,
  getTradingStatusAction,
  sendTradingStatusEmails,
  executeAction
};
