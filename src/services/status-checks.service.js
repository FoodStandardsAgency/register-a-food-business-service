"use strict";

const moment = require("moment");
const { INFO, logEmitter } = require("./logging.service");
const {
  getNextActionAndDate,
  getUnsuccessfulChecks,
  getMostRecentCheck,
  getVerifiedRegistrationDates,
  getTemplateIdFromEmailType,
  generateStatusEmailToSend
} = require("../utils/tradingStatusHelpers.js");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const {
  updateTradingStatusCheck,
  updateNextStatusDate
} = require("../connectors/statusChecksDb/status-checks.connector");
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
 * Processes the trading status of a registration and updates the local authority configuration accordingly.
 * It checks if the registration is due for a status check, updates the status, and sends notifications.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 */
const processTradingStatus = async (registration, laConfig) => {
  const tradingStatusDates = getVerifiedRegistrationDates(registration);
  if (!tradingStatusDates.valid) {
    throw new Error(`Trading status checks validation error: ${tradingStatusDates.error}`);
  }

  const unsuccessfulChecks = getUnsuccessfulChecks(tradingStatusDates.trading_status_checks);
  if (unsuccessfulChecks.length > 0) {
    const emailsToSend = unsuccessfulChecks.map((check) => ({
      type: check.type,
      email: check.email,
      templateId: getTemplateIdFromEmailType(check.type, registration.submission_language === "cy")
    }));
    const success = await sendTradingStatusEmails(registration, emailsToSend);
    return success
      ? { fsaId: registration.fsa_rn, message: "Previously unsuccessful emails sent" }
      : {
          fsaId: registration.fsa_rn,
          error: "At least one previously unsuccessful email failed again"
        };
  } else {
    // No unsuccessful checks, proceed with the next action
    const action = getTradingStatusAction(tradingStatusDates, laConfig);
    let result;
    if (action.time.isBefore(moment())) {
      // Perform the action based on the trading status
      switch (action.type) {
        case DELETE_REGISTRATION:
          // Delete registration after retention period
          break;
        case REGULAR_CHECK:
        case INITIAL_CHECK:
        case INITIAL_CHECK_CHASE:
        case REGULAR_CHECK_CHASE:
        case FINISHED_TRADING_LA:
        case STILL_TRADING_LA:
          const emailsToSend = generateStatusEmailToSend(registration, action.type, laConfig);
          await sendTradingStatusEmails(registration, emailsToSend);
          result = { fsaId: registration["fsa-rn"], message: `${action.type} emails sent` };
          break;
        case INITIAL_REGISTRATION:
        case CONFIRMED_TRADING:
        case CONFIRMED_NOT_TRADING:
          throw new Error(`Action type not processable: ${action.type}`);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      const nextAction = getNextActionAndDate(action, laConfig.trading_status);

      // Schedule the next action
      await updateNextStatusDate(registration["fsa-rn"], nextAction.time);

      result.message += `, ${nextAction.type} scheduled for ${nextAction.time.toISOString()}`;
      return result;
    } else {
      await updateNextStatusDate(registration["fsa-rn"], action.time);

      return {
        fsaId: registration.fsa_rn,
        message: `${action.type} rescheduled for ${action.time.format("YYYY-MM-DD HH:mm:ss")}`
      };
    }
  }
};

/**
 * Determines the trading status action based on the registration and local authority configuration.
 * It checks if the registration is due for a status check and returns the appropriate action.
 *
 * @param {Object} tradingStatusDates - The registration object containing trading status and next status date.
 * @param {Object} laConfig - The local authority configuration containing status check interval.
 * @returns {string} The action to be taken ("check_status", "notify_inactive", or "no_action").
 */
const getTradingStatusAction = (tradingStatusDates, laConfig) => {
  const mostRecentCheck = getMostRecentCheck(tradingStatusDates.trading_status_checks);
  const nextAction = getNextActionAndDate(mostRecentCheck, laConfig.trading_status);
  return nextAction;
};

/**
 * Sends emails for trading status updates and notifications to appropriate recipients.
 *
 * @returns {Promise} Promise that resolves when emails are sent.
 */
const sendTradingStatusEmails = async (registration, emailsToSend) => {
  logEmitter.emit("functionCall", "status-checks.service", "sendTradingStatusEmails");
  logEmitter.emit(INFO, `Started sendTradingStatusEmails for FSAid: ${registration.fsa_rn}`);

  const data = {};
  let success = true;

  for (const emailToSend of emailsToSend) {
    const { address, templateId, type, emailReplyToId } = emailToSend;
    try {
      await sendSingleEmail(
        templateId,
        address,
        emailReplyToId,
        data,
        null,
        registration.fsa_rn,
        type
      );
      logEmitter.emit(INFO, `Sent ${type} email to ${address}`);
    } catch (error) {
      success = false;
      logEmitter.emit(ERROR, `Failed to send ${type} email to ${address}: ${error.message}`);
    }

    await updateTradingStatusCheck(registration["fsa-rn"], {
      type,
      time: moment().toISOString(),
      email: address,
      sent: success
    });
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
