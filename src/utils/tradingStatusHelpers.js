"use strict";

const moment = require("moment");
const {
  YEARS_TIME_INTERVAL,
  MONTHS_TIME_INTERVAL,
  WEEKS_TIME_INTERVAL,
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
  INITIAL_CHECK_TEMPLATE_ID,
  INITIAL_CHECK_CHASE_TEMPLATE_ID,
  REGULAR_CHECK_TEMPLATE_ID,
  REGULAR_CHECK_CHASE_TEMPLATE_ID,
  FINISHED_TRADING_LA_TEMPLATE_ID,
  STILL_TRADING_LA_TEMPLATE_ID,
  INITIAL_CHECK_TEMPLATE_ID_CY,
  INITIAL_CHECK_CHASE_TEMPLATE_ID_CY,
  REGULAR_CHECK_TEMPLATE_ID_CY,
  REGULAR_CHECK_CHASE_TEMPLATE_ID_CY,
  FINISHED_TRADING_LA_TEMPLATE_ID_CY,
  STILL_TRADING_LA_TEMPLATE_ID_CY
} = require("../config");

/**
 * Validates the date fields in a registration object to ensure they are properly formatted and
 * returns them as moment dates ready for comparison.
 * Checks and gets submission date, last confirmed trading date, finished trading date, and trading status checks.
 *
 * @param {Object} registration - The registration object containing date fields to validate.
 * @returns {Object} An object containing validated moment dates or error messages for each field.
 */
const getVerifiedRegistrationDates = (registration) => {
  const result = {
    trading_status_checks: [],
    valid: true
  };

  // Submission date should always be supplied and valid
  const submission_date = registration?.reg_submission_date;
  if (submission_date && moment(submission_date).isValid()) {
    result.trading_status_checks.push({
      type: INITIAL_REGISTRATION,
      time: moment(submission_date).clone()
    });
  } else {
    result.valid = false;
    result.error = `Invalid registration submission date for registration ${registration["fsa-rn"]}`;
  }

  // Last confirmed trading date should be valid if present
  const last_confirmed_trading = registration?.last_confirmed_trading;
  if (last_confirmed_trading) {
    if (moment(last_confirmed_trading).isValid()) {
      result.trading_status_checks.push({
        type: CONFIRMED_TRADING,
        time: moment(last_confirmed_trading).clone()
      });
    } else {
      result.valid = false;
      result.error = `Invalid last confirmed trading date for registration ${registration["fsa-rn"]}`;
    }
  }

  // Finished trading date should be valid if present
  const confirmed_not_trading = registration?.confirmed_not_trading;
  if (confirmed_not_trading) {
    if (moment(confirmed_not_trading).isValid()) {
      result.trading_status_checks.push({
        type: "CONFIRMED_NOT_TRADING",
        time: moment(confirmed_not_trading).clone()
      });
    } else {
      result.valid = false;
      result.error = `Invalid finished trading date for registration ${registration["fsa-rn"]}`;
    }
  }

  // Check that don't have last confirmed trading date after finished trading dates
  if (last_confirmed_trading && confirmed_not_trading) {
    if (moment(last_confirmed_trading).isAfter(moment(confirmed_not_trading))) {
      result.valid = false;
      result.error = `Last confirmed trading date is after finished trading date for registration ${registration["fsa-rn"]}`;
    }
  }

  // Check if trading status checks are valid, if present
  const tradingStatus = registration.status?.trading_status_checks;
  if (Array.isArray(tradingStatus) && tradingStatus.length > 0) {
    tradingStatus.forEach((check) => {
      const date = check?.time;
      if (date && moment(date).isValid()) {
        result.trading_status_checks.push({
          type: check.type,
          time: moment(date).clone(),
          address: check.address,
          sent: check.sent || false
        });
      } else {
        result.valid = false;
        result.error = `Invalid trading status check date for ${check.type} for registration ${registration["fsa-rn"]}`;
      }
    });
  }

  return result;
};

/**
 * Gets the unsuccessful checks of a specific type from the trading status checks array.
 * If no type is specified, returns the unsuccessful checks of any type.
 *
 * @param {Array} tradingStatusChecks - Array of trading status check objects.
 * @param {string} [type] - Optional type of check to filter by.
 * @returns {Array} Array containing the types and times of the unsuccessful checks.
 */
const getUnsuccessfulChecks = (tradingStatusChecks, type) => {
  const filteredChecks = tradingStatusChecks.filter((check) => !type || check.type === type);
  return filteredChecks.filter((check) => check.sent === false);
};

/**
 * Gets the most recent check of a specific type from the trading status checks array.
 * If no type is specified, returns the most recent check of any type.
 *
 * @param {Array} tradingStatusChecks - Array of trading status check objects.
 * @param {string} [type] - Optional type of check to filter by.
 * @returns {Object|null} Object containing the type and time of the most recent check, or null if no checks found.
 */
const getMostRecentCheck = (tradingStatusChecks, type) => {
  const filteredChecks = tradingStatusChecks.filter((check) => !type || check.type === type);

  if (filteredChecks.length === 0) {
    return null;
  }

  const mostRecent = filteredChecks.reduce((latest, check) => {
    return check.time.isAfter(latest.time) ? check : latest;
  }, filteredChecks[0]);

  return {
    type: mostRecent.type,
    time: mostRecent.time.clone()
  };
};

/**
 * Determines the next action that should be taken for a registration based on
 * its trading status history and configuration.
 *
 * @param {Object} mostRecentCheck - The most recent notification/status event.
 * @param {Object} tradingStatusConfig - Configuration for trading status checks.
 * @returns {Object|null} Object containing the type and time of the next action, or null if no action needed.
 */
const getNextActionAndDate = (mostRecentCheck, tradingStatusConfig) => {
  const mostRecentCheckTime = moment(mostRecentCheck.time).clone();
  let result = null;

  // Early return if no mostRecentCheck
  if (!mostRecentCheck || !mostRecentCheck.type) {
    return result;
  }

  // Early return if no checks configured
  if (!tradingStatusConfig.regular_check && !tradingStatusConfig.initial_check) {
    return result;
  }

  // Handle CONFIRMED_NOT_TRADING
  if (mostRecentCheck.type === CONFIRMED_NOT_TRADING) {
    result = { type: FINISHED_TRADING_LA, time: mostRecentCheckTime };
  }
  // Handle FINISHED_TRADING_LA
  else if (mostRecentCheck.type === FINISHED_TRADING_LA) {
    const deleteTime = mostRecentCheckTime.add(
      tradingStatusConfig.data_retention_period,
      YEARS_TIME_INTERVAL
    );
    result = { type: DELETE_REGISTRATION, time: deleteTime };
  }
  // Handle STILL_TRADING_LA
  else if (mostRecentCheck.type === STILL_TRADING_LA) {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }
  // Handle CONFIRMED_TRADING
  else if (mostRecentCheck.type === CONFIRMED_TRADING) {
    if (tradingStatusConfig.confirmed_trading_notifications) {
      result = { type: STILL_TRADING_LA, time: mostRecentCheckTime };
    } else if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }
  // Handle INITIAL_REGISTRATION
  else if (mostRecentCheck.type === INITIAL_REGISTRATION) {
    if (tradingStatusConfig.initial_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.initial_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: INITIAL_CHECK, time: nextActionTime };
    } else if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }
  // Handle INITIAL_CHECK
  else if (mostRecentCheck.type === INITIAL_CHECK) {
    if (tradingStatusConfig.initial_check && tradingStatusConfig.chase) {
      const nextActionTime = mostRecentCheckTime.clone().add(2, WEEKS_TIME_INTERVAL);
      // Sanity check to ensure old initial check is not chased e.g. due to config change
      if (nextActionTime.clone().add(2, WEEKS_TIME_INTERVAL).isAfter(moment())) {
        result = { type: INITIAL_CHECK_CHASE, time: nextActionTime };
      }
    }
    if (!result && tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }
  // Handle REGULAR_CHECK
  else if (mostRecentCheck.type === REGULAR_CHECK) {
    if (tradingStatusConfig.regular_check && tradingStatusConfig.chase) {
      const nextActionTime = mostRecentCheckTime.clone().add(2, WEEKS_TIME_INTERVAL);
      // Sanity check to ensure old regular check is not chased e.g. due to config change
      if (nextActionTime.clone().add(2, WEEKS_TIME_INTERVAL).isAfter(moment())) {
        result = { type: REGULAR_CHECK_CHASE, time: nextActionTime };
      }
    }
    if (!result && tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }
  // Handle CHASE types
  else if (
    mostRecentCheck.type === INITIAL_CHECK_CHASE ||
    mostRecentCheck.type === REGULAR_CHECK_CHASE
  ) {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(
        tradingStatusConfig.regular_check,
        MONTHS_TIME_INTERVAL
      );
      result = { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (
    result &&
    WEEKS_TIME_INTERVAL === "weeks" && // Do not stagger if not running in real-time
    (result.type === INITIAL_CHECK || result.type === REGULAR_CHECK)
  ) {
    result.time = staggerOldDates(result.time);
  }
  return result;
};

const getTemplateIdFromEmailType = (emailType, cy) => {
  let templateID;
  switch (emailType) {
    case INITIAL_CHECK:
      templateID = cy ? INITIAL_CHECK_TEMPLATE_ID_CY : INITIAL_CHECK_TEMPLATE_ID;
      break;
    case INITIAL_CHECK_CHASE:
      templateID = cy ? INITIAL_CHECK_CHASE_TEMPLATE_ID_CY : INITIAL_CHECK_CHASE_TEMPLATE_ID;
      break;
    case REGULAR_CHECK:
      templateID = cy ? REGULAR_CHECK_TEMPLATE_ID_CY : REGULAR_CHECK_TEMPLATE_ID;
      break;
    case REGULAR_CHECK_CHASE:
      templateID = cy ? REGULAR_CHECK_CHASE_TEMPLATE_ID_CY : REGULAR_CHECK_CHASE_TEMPLATE_ID;
      break;
    case FINISHED_TRADING_LA:
      templateID = cy ? FINISHED_TRADING_LA_TEMPLATE_ID_CY : FINISHED_TRADING_LA_TEMPLATE_ID;
      break;
    case STILL_TRADING_LA:
      templateID = cy ? STILL_TRADING_LA_TEMPLATE_ID_CY : STILL_TRADING_LA_TEMPLATE_ID;
      break;
    default:
      throw new Error(`Unknown email type: ${emailType}`);
  }
  return templateID;
};

/**
 * Checks if the given action type requires sending email notifications.
 *
 * @param {string} actionType - The action type to check.
 * @returns {boolean} True if the action type requires email notifications.
 */
const isEmailNotificationAction = (actionType) => {
  return [
    REGULAR_CHECK,
    INITIAL_CHECK,
    INITIAL_CHECK_CHASE,
    REGULAR_CHECK_CHASE,
    FINISHED_TRADING_LA,
    STILL_TRADING_LA
  ].includes(actionType);
};

/**
 * Generates the appropriate status email content to send based on the registration status.
 *
 * @returns {Object} Email content and metadata.
 */
const generateStatusEmailToSend = (registration, emailType, lcContactConfig) => {
  const cy = registration.submission_language === "cy";
  let emailsToSend = [];
  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  const templateID = getTemplateIdFromEmailType(emailType, cy);

  if (emailType !== FINISHED_TRADING_LA && emailType !== STILL_TRADING_LA) {
    let emailToSend = {
      type: emailType,
      address: fboEmailAddress,
      templateId: templateID
    };

    if (lcContactConfig.local_council_email_reply_to_ID) {
      // Update reply-to email address for emails to FBO
      emailToSend.emailReplyToId = lcContactConfig.local_council_email_reply_to_ID;
    }

    emailsToSend.push(emailToSend);
  } else {
    // Send email to local authority addresses
    for (let recipientEmailAddress of lcContactConfig.tradingStatusLaEmailAddresses) {
      emailsToSend.push({
        type: emailType,
        address: recipientEmailAddress,
        templateId: templateID
      });
    }

    // Only send finished trading email to standards authority addresses
    if (emailType === FINISHED_TRADING_LA) {
      for (let recipientEmailAddress of lcContactConfig.tradingStatusStandardsEmailAddresses ||
        []) {
        emailsToSend.push({
          type: emailType,
          address: recipientEmailAddress,
          templateId: templateID
        });
      }
    }
  }

  return emailsToSend;
};

/**
 * Recent dates (in the last 3 months) can be left alone but older dates will be staggered.
 * This is to ensure that the emails are not sent all at once.
 * The date is staggered by updating the year while leaving the date and month alone.
 * @param {Date} date - The original calculated date of the next check.
 * @returns {Date} - The new date, staggered if required.
 */
function staggerOldDates(date) {
  const now = new Date();
  let newDate = date.toDate();

  // If more than three months ago, staggering is required
  if (date.clone().add(3, MONTHS_TIME_INTERVAL).isBefore(moment())) {
    // If the date is in the past but falls on today's date, set it to the current year
    if (newDate.getMonth() === now.getMonth() && newDate.getDate() === now.getDate()) {
      // Set the time to midnight to ensure processed
      newDate = new Date(now.getFullYear(), newDate.getMonth(), newDate.getDate());
    }

    // If the date is in the past but falls later in the year, set it to the current year
    // This will ensure that the date is in the future
    else if (
      newDate.getMonth() > now.getMonth() ||
      (newDate.getMonth() === now.getMonth() && newDate.getDate() > now.getDate())
    ) {
      // When recalculating on that day it will fall into the matching case above and process immediately
      newDate.setFullYear(now.getFullYear());
    } else {
      // Dates earlier in the year will be set to next year
      // When recalculating on that day it will fall into the matching case above and process immediately
      newDate.setFullYear(now.getFullYear() + 1);
    }
  }

  return moment(newDate);
}

module.exports = {
  getUnsuccessfulChecks,
  getNextActionAndDate,
  getMostRecentCheck,
  getVerifiedRegistrationDates,
  getTemplateIdFromEmailType,
  generateStatusEmailToSend,
  isEmailNotificationAction,
  staggerOldDates
};
