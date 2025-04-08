"use strict";

/**
 * Processes the trading status of a registration and updates the local authority configuration accordingly.
 * It checks if the registration is due for a status check, updates the status, and sends notifications.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} laConfig - The local authority configuration.
 */
const processTradingStatus = (registration, laConfig) => {
  const action = getTradingStatusAction(registration, laConfig);
};

/**
 * Determines the trading status action based on the registration and local authority configuration.
 * It checks if the registration is due for a status check and returns the appropriate action.
 *
 * @param {Object} registration - The registration object containing trading status and next status date.
 * @param {Object} laConfig - The local authority configuration containing status check interval.
 * @returns {string} The action to be taken ("check_status", "notify_inactive", or "no_action").
 */
const getTradingStatusAction = (registration, laConfig) => {
  const tradingStatusDates = getAndCheckRegistrationDates(registration);
  if (!tradingStatusDates.valid) {
    throw new Error(`Trading status checks validation error: ${tradingStatusDates.error}`);
  }

  const nextAction = getNextActionAndDate(
    registration,
    tradingStatusDates,
    laConfig.trading_status
  );
};

/**
 * Validates the date fields in a registration object to ensure they are properly formatted and
 * returns them as moment dates ready for comparison.
 * Checks and gets submission date, last confirmed trading date, finished trading date, and trading status checks.
 *
 * @param {Object} registration - The registration object containing date fields to validate.
 * @returns {Object} An object containing validated moment dates or error messages for each field.
 */
const getAndCheckRegistrationDates = (registration) => {
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
      type: "REGISTRATION_SUBMISSION",
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
        type: "CONFIRMED_TRADING",
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
          time: moment(check.time.$date).clone()
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
 * Gets the most recent action configured for trading status checks.
 *
 * @param {Object} tradingStatus - Trading status configuration.
 * @returns {Object} The most recently configured action.
 */
const getMostRecentActionConfigured = (tradingStatus) => {};

/**
 * Calculates the schedule for configured actions based on trading status configuration.
 * This includes initial checks, regular checks, and chase notifications.
 *
 * @param {Array} tradingStatusChecks - Array of trading status check objects.
 * @param {Object} tradingStatusConfig - Configuration for trading status checks.
 * @returns {Object} Schedule of configured actions with their dates.
 */
const getConfiguredActionSchedule = (tradingStatusChecks, tradingStatusConfig) => {
  const mostRecentInitialCheck = getMostRecentCheck("INITIAL_CHECK"); // There should only be one anyway
  const mostRecentRegularCheck = getMostRecentCheck("REGULAR_CHECK"); // There should only be one anyway
  const nextRegularCheck = getNextRegularCheck(
    tradingStatusConfig,
    tradingStatusChecks.reg_submission_date,
    mostRecentInitialCheck,
    mostRecentRegularCheck
  );

  return {
    INITIAL_CHECK:
      tradingStatusConfig.initial_check &&
      regSubmissionDate.add(tradingStatusConfig.initial_check, "months"),
    INITIAL_CHECK_CHASE:
      tradingStatusConfig.initial_check &&
      tradingStatusConfig.chase &&
      regSubmissionDate.add(tradingStatusConfig.initial_check, "months").add(2, "weeks"),
    REGULAR_CHECK: tradingStatusConfig.regular_check && nextRegularCheck,
    REGULAR_CHECK_CHASE:
      tradingStatusConfig.regular_check &&
      tradingStatusConfig.chase &&
      nextRegularCheck.add(2, "weeks")
  };
};

/**
 * Calculates the date of the next regular check based on configuration and previous checks.
 *
 * @param {Object} tradingStatusConfig - Configuration for trading status checks.
 * @param {Object} regSubmissionDate - Registration submission date as moment object.
 * @param {Object} mostRecentInitialCheck - Most recent initial check.
 * @param {Object} mostRecentRegularCheck - Most recent regular check.
 * @returns {Object} Moment date object for the next regular check.
 */
const getNextRegularCheck = (
  tradingStatusConfig,
  regSubmissionDate,
  mostRecentInitialCheck,
  mostRecentRegularCheck
) => {
  const nextRegularCheck = null;
  if (tradingStatusConfig.regular_check) {
    if (mostRecentRegularCheck) {
      nextRegularCheck = mostRecentRegularCheck.add(tradingStatusConfig.regular_check, "months");
    } else if (mostRecentInitialCheck) {
      nextRegularCheck = mostRecentInitialCheck.add(tradingStatusConfig.regular_check, "months");
    } else {
      if (tradingStatusConfig.initial_check) {
        nextRegularCheck = regSubmissionDate
          .add(tradingStatusConfig.initial_check, "months")
          .add(tradingStatusConfig.regular_check, "months");
      }
    }

    return nextRegularCheck;
  }
};

/**
 * Determines the next action that should be taken for a registration based on
 * its trading status history and configuration.
 *
 * @param {Object} registration - The registration object.
 * @param {Object} tradingStatusChecks - Validated trading status checks.
 * @param {Object} tradingStatusConfig - Configuration for trading status checks.
 * @returns {Object|null} Object containing the type and time of the next action, or null if no action needed.
 */
const getNextActionAndDate = (registration, tradingStatusChecks, tradingStatusConfig) => {
  if (tradingStatusChecks.confirmed_not_trading) {
    const confirmedNotTrading = moment(tradingStatusChecks.confirmed_not_trading);

    if (mostRecentCheck.type !== "FINISHED_TRADING_LA") {
      // LA notification not sent yet
      return { type: "FINISHED_TRADING_LA", time: confirmedNotTrading };
    }

    const deleteTime = moment(confirmedNotTrading)
      .clone()
      .add(laConfig.data_retention_period, "years");

    // Date is older than data retention period so delete record
    return { type: "DELETE_REGISTRATION", time: deleteTime };
  }

  const mostRecentCheck = getMostRecentCheck(tradingStatusChecks);
  mostRecentCheckTime = moment(mostRecentCheck.time).clone();

  if (mostRecentCheck.type === "CONFIRMED_TRADING") {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: "REGULAR_CHECK", time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === "INITIAL_REGISTRATION") {
    if (tradingStatusConfig.initial_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.initial_check, "months");

      return { type: "INITIAL_CHECK", time: nextActionTime };
    } else if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: "REGULAR_CHECK", time: nextActionTime };
    }
  }

  if (mostRecentCheck.type === "INITIAL_CHECK") {
    if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.initial_check, "months");

      return { type: "INITIAL_CHECK", time: nextActionTime };
    } else if (tradingStatusConfig.regular_check) {
      const nextActionTime = mostRecentCheckTime.add(tradingStatusConfig.regular_check, "months");

      return { type: "REGULAR_CHECK", time: nextActionTime };
    }
  }

  return null;
};

/**
 * Generates the appropriate status email content to send based on the registration status.
 *
 * @returns {Object} Email content and metadata.
 */
const generateStatusEmailToSend = () => {};

/**
 * Sends emails for trading status updates and notifications to appropriate recipients.
 *
 * @returns {Promise} Promise that resolves when emails are sent.
 */
const sendTradingStatusEmails = () => {};

module.exports = {
  processTradingStatus,
  getTradingStatusAction,
  generateStatusEmailToSend,
  sendTradingStatusEmails
};
