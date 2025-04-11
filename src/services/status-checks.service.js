"use strict";

const moment = require("moment");
const {
  getNextActionAndDate,
  getMostRecentCheck,
  getVerifiedRegistrationDates,
  generateStatusEmailToSend
} = require("../utils/tradingStatusHelpers.js");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
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
  DELETE_REGISTRATION
} = require("../config");

/**
 * Determines the trading status action based on the registration and local authority configuration.
 * It checks if the registration is due for a status check and returns the appropriate action.
 *
 * @param {Object} tradingStatusDates - The registration object containing trading status and next status date.
 * @param {Object} laConfig - The local authority configuration containing status check interval.
 * @returns {string} The action to be taken ("check_status", "notify_inactive", or "no_action").
 */
const getTradingStatusAction = (tradingStatusDates, laConfig) => {
  const mostRecentCheck = getMostRecentCheck(tradingStatusDates);
  const nextAction = getNextActionAndDate(mostRecentCheck, laConfig.trading_status);
  return nextAction;
};

/**
 * Processes the trading status of a registration and updates the local authority configuration accordingly.
 * It checks if the registration is due for a status check, updates the status, and sends notifications.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 */
const processTradingStatus = (registration, laConfig) => {
  const tradingStatusDates = getVerifiedRegistrationDates(registration);
  if (!tradingStatusDates.valid) {
    throw new Error(`Trading status checks validation error: ${tradingStatusDates.error}`);
  }

  const unsuccessfulChecks = getUnsuccessfulChecks(tradingStatusDates);
  if (unsuccessfulChecks.length > 0) {
    const emailsToSend = unsuccessfulChecks.map((check) => ({
      type: check.type,
      email: check.email,
      templateId: getTemplateIdFromEmailType(check.type, laConfig)
    }));
  } else {
    // No unsuccessful checks, proceed with the next action
  }

  const action = getTradingStatusAction(tradingStatusDates, laConfig);
  if (action.time.isBefore(moment())) {
    // Perform the action based on the trading status
    switch (action.type) {
      case FINISHED_TRADING_LA:
        // Notify local authority of finished trading
        break;
      case DELETE_REGISTRATION:
        // Delete registration after retention period
        break;
      case REGULAR_CHECK:
        // Schedule regular check
        break;
      case INITIAL_CHECK:
        // Schedule initial check
        break;
      case INITIAL_CHECK_CHASE:
        // Chase initial check
        break;
      case REGULAR_CHECK_CHASE:
        // Chase regular check
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    const nextAction = getNextActionAndDate(action, laConfig.trading_status);
    // Schedule the next action
    // e.g., update the registration with the next action date
    registration.next_status_date = nextAction.time;
  } else {
    registration.next_status_date = action.time;
  }
};

/**
 * Sends emails for trading status updates and notifications to appropriate recipients.
 *
 * @returns {Promise} Promise that resolves when emails are sent.
 */
const sendTradingStatusEmails = async (registration, emailType, lcContactConfig) => {
  logEmitter.emit("functionCall", "status-checks.service", "sendTradingStatusEmails");
  logEmitter.emit(INFO, `Started sendTradingStatusEmails for FSAid: ${registration.fsa_rn}`);

  const emailsToSend = generateStatusEmailToSend(registration, emailType, lcContactConfig);
  const data = {};
  let success = true;

  for (const emailToSend of emailsToSend) {
    const { address, templateId, emailReplyToId } = emailToSend;
    try {
      await sendSingleEmail(
        templateId,
        address,
        emailReplyToId,
        data,
        null,
        registration.fsa_rn,
        emailType
      );
      logEmitter.emit(INFO, `Sent ${emailType} email to ${address}`);
    } catch (error) {
      success = false;
      logEmitter.emit(ERROR, `Failed to send ${emailType} email to ${address}: ${error.message}`);
    }
  }

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
  sendTradingStatusEmails
};
