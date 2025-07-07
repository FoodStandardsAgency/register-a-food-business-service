"use strict";

const moment = require("moment");
const i18n = require("../utils/i18n/i18n");
const { INFO, WARN, ERROR, logEmitter } = require("./logging.service");
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
      emailReplyToId: laConfig.emailReplyToId,
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
    if (action && action.time.isBefore(moment())) {
      // Perform the action based on the trading status
      switch (action.type) {
        case DELETE_REGISTRATION:
          // Delete registration after retention period
          await deleteRegistration(registration["fsa-rn"]);
          return { fsaId: registration["fsa-rn"], message: `Registration deleted` };
          break;
        case REGULAR_CHECK:
        case INITIAL_CHECK:
        case INITIAL_CHECK_CHASE:
        case REGULAR_CHECK_CHASE:
        case FINISHED_TRADING_LA:
        case STILL_TRADING_LA:
          const emailsToSend = generateStatusEmailToSend(registration, action.type, laConfig);
          await sendTradingStatusEmails(registration, laConfig, action.type, emailsToSend);
          result = { fsaId: registration["fsa-rn"], message: `${action.type} emails sent` };
          break;
        case INITIAL_REGISTRATION:
        case CONFIRMED_TRADING:
        case CONFIRMED_NOT_TRADING:
          throw new Error(`Action type not processable: ${action.type}`);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      action.time = moment();
      const nextAction = getNextActionAndDate(action, laConfig.trading_status);

      // Schedule the next action (or clear the next status date if no action is needed)
      await updateNextStatusDate(registration["fsa-rn"], nextAction?.time);

      result.message += `, ${nextAction.type} scheduled for ${nextAction.time.format("YYYY-MM-DD HH:mm:ss")}`;
      return result;
    } else {
      // Schedule the next action (or clear the next status date if no action is needed)
      await updateNextStatusDate(registration["fsa-rn"], action?.time);
      const message = action
        ? `${action.type} rescheduled for ${action.time.format("YYYY-MM-DD HH:mm:ss")}`
        : "No action needed, next status date cleared";
      return {
        fsaId: registration["fsa-rn"],
        message
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

const transformDataForNotify = (registration, laConfig, actionType, i18nUtil) => {
  const encryptedId = encryptId(registration._id);
  let status;
  switch (actionType) {
    case STILL_TRADING_LA:
      status = "still trading";
      break;
    case FINISHED_TRADING_LA:
      status = "no longer trading";
      break;
    case INITIAL_CHECK_CHASE:
      status = " - reminder";
      break;
    case REGULAR_CHECK_CHASE:
      status = " - reminder";
      break;
    default:
    // No additional text needed for other action types
  }
  let data = {
    registration_number: registration["fsa-rn"],
    additional_text: status,
    la_name: i18nUtil.tLa(laConfig.local_council),
    reg_submission_date: moment(registration.reg_submission_date).format("DD MMM YYYY"),
    trading_name: registration.establishment.establishment_details.establishment_trading_name,
    operator_name: `${registration.establishment.operator.operator_first_name} ${registration.establishment.operator.operator_last_name}`,
    trading_yes_link: `${FRONT_END_URL}tradingstatus/stilltrading/${registration["fsa-rn"]}?token=${encryptedId}`,
    trading_no_link: `${FRONT_END_URL}tradingstatus/nolongertrading/${registration["fsa-rn"]}?token=${encryptedId}`
  };
  return data;
};

/**
 * Sends emails for trading status updates and notifications to appropriate recipients.
 *
 * @returns {Promise<boolean>} Promise that resolves to true if all emails were sent successfully, false otherwise.
 */
const sendTradingStatusEmails = async (registration, laConfig, actionType, emailsToSend) => {
  logEmitter.emit("functionCall", "status-checks.service", "sendTradingStatusEmails");
  logEmitter.emit(INFO, `Started sendTradingStatusEmails for FSA id: ${registration["fsa-rn"]}`);

  const i18nUtil = new i18n(registration.submission_language || "en");
  const data = transformDataForNotify(registration, laConfig, actionType, i18nUtil);
  let success = true;

  for (const emailToSend of emailsToSend) {
    const { address, templateId, type, emailReplyToId } = emailToSend;
    if (
      (await sendSingleEmail(
        templateId,
        address,
        emailReplyToId,
        data,
        null,
        registration["fsa-rn"],
        type
      )) !== null // Undefined or true indicates success but null indicates failure (consider amending in connector)
    ) {
      logEmitter.emit(INFO, `Sent ${type} email to ${address}`);
    } else {
      success = false;
      logEmitter.emit(ERROR, `Failed to send ${type} email to ${address}`);
    }

    await updateTradingStatusCheck(registration["fsa-rn"], {
      type,
      time: moment().toDate(),
      address,
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

  return success;
};

module.exports = {
  processTradingStatus,
  getTradingStatusAction,
  sendTradingStatusEmails
};
