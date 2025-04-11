"use strict";

const moment = require("moment");
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
    submission_date: null,
    last_confirmed_trading: null,
    confirmed_not_trading: null,
    trading_status_checks: [],
    valid: true
  };

  // Submission date should always be supplied and valid
  const submission_date = registration?.reg_submission_date?.$date;
  if (submission_date && moment(submission_date).isValid()) {
    result.submission_date = moment(submission_date).clone();
    result.trading_status_checks.push({
      type: INITIAL_REGISTRATION,
      time: moment(submission_date).clone()
    });
  } else {
    result.valid = false;
    result.error = `Invalid registration submission date for registration ${registration.fsa_rn}`;
  }

  // Last confirmed trading date should be valid if present
  const last_confirmed_trading = registration?.last_confirmed_trading?.$date;
  if (last_confirmed_trading) {
    if (moment(last_confirmed_trading).isValid()) {
      result.last_confirmed_trading = moment(last_confirmed_trading).clone();
      result.trading_status_checks.push({
        type: CONFIRMED_TRADING,
        time: moment(last_confirmed_trading).clone()
      });
    } else {
      result.valid = false;
      result.error = `Invalid last confirmed trading date for registration ${registration.fsa_rn}`;
    }
  }

  // Finished trading date should be valid if present
  const confirmed_not_trading = registration?.confirmed_not_trading?.$date;
  if (confirmed_not_trading) {
    if (moment(confirmed_not_trading).isValid()) {
      result.confirmed_not_trading = moment(confirmed_not_trading).clone();
      result.confirmed_not_trading.push({
        type: "CONFIRMED_NOT_TRADING",
        time: moment(confirmed_not_trading).clone()
      });
    } else {
      result.valid = false;
      result.error = `Invalid finished trading date for registration ${registration.fsa_rn}`;
    }
  }

  // Check if trading status checks are valid, if present
  const tradingStatus = registration.status?.trading_status_checks;
  if (Array.isArray(tradingStatus) && tradingStatus.length > 0) {
    tradingStatus.forEach((check) => {
      if (check.time && check.time.$date && moment(check.time.$date).isValid()) {
        result.trading_status_checks.push({
          type: check.type,
          time: moment(check.time.$date).clone(),
          address: check.address,
          success: check.success || false
        });
      } else {
        result.valid = false;
        result.error = `Invalid trading status check date for ${check.type} for registration ${registration.fsa_rn}`;
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
  return filteredChecks.filter((check) => check.success === false);
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
  if (mostRecentCheck.type === CONFIRMED_NOT_TRADING) {
    // LA notification not sent yet
    return { type: FINISHED_TRADING_LA, time: mostRecentCheck.time };
  }

  if (mostRecentCheck.type === FINISHED_TRADING_LA) {
    // LA notification sent, but not yet deleted
    const deleteTime = moment(mostRecentCheck.time).add(
      tradingStatusConfig.data_retention_period,
      "years"
    );

    return { type: DELETE_REGISTRATION, time: deleteTime };
  }

  const mostRecentCheckTime = moment(mostRecentCheck.time).clone();

  if (mostRecentCheck.type === STILL_TRADING_LA) {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === CONFIRMED_TRADING) {
    if (tradingStatusConfig.confirmed_trading_notifications) {
      return { type: STILL_TRADING_LA, time: mostRecentCheckTime };
    }

    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === INITIAL_REGISTRATION) {
    if (tradingStatusConfig.initial_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.initial_check, "months");

      return { type: INITIAL_CHECK, time: nextActionTime };
    } else if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === INITIAL_CHECK) {
    if (tradingStatusConfig.initial_check && tradingStatusConfig.chase) {
      const nextActionTime = mostRecentCheckTime.add(2, "weeks");

      // Sanity check to ensure old initial check is not chased e.g. due to config change
      if (nextActionTime.clone().add(2, "weeks").isAfter(moment())) {
        return { type: INITIAL_CHECK_CHASE, time: nextActionTime };
      }
    }

    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === REGULAR_CHECK) {
    if (tradingStatusConfig.regular_check && tradingStatusConfig.chase) {
      const nextActionTime = mostRecentCheckTime.clone().add(2, "weeks");

      // Sanity check to ensure old regular check is not chased e.g. due to config change
      if (nextActionTime.clone().add(2, "weeks").isAfter(moment())) {
        return { type: REGULAR_CHECK_CHASE, time: nextActionTime };
      }
    }

    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  if (
    mostRecentCheck.type === INITIAL_CHECK_CHASE ||
    mostRecentCheck.type === REGULAR_CHECK_CHASE
  ) {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: REGULAR_CHECK, time: nextActionTime };
    }
  }

  return null;
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

    if (lcContactConfig.emailReplyToId) {
      // Update reply-to email address for emails to FBO
      emailToSend["emailReplyToId"] = lcContactConfig.emailReplyToId;
    }

    emailsToSend.push(emailToSend);
  } else {
    // Send email to local authority addresses
    for (let recipientEmailAddress in lcContactConfig.tradingStatusEmailAddresses) {
      emailsToSend.push({
        type: emailType,
        address: recipientEmailAddress,
        templateId: templateID
      });
    }
  }

  return emailsToSend;
};

module.exports = {
  getNextActionAndDate,
  getMostRecentCheck,
  getVerifiedRegistrationDates,
  generateStatusEmailToSend
};
