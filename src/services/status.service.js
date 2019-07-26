/**
 * Functions for getting and setting status values
 * @module services/status
 */

const {
  getStoredStatus,
  updateStoredStatus,
  getEmailDistribution
} = require("../connectors/status/status-db.connector");

const { logEmitter } = require("./logging.service");
const {
  NOTIFY_STATUS_TEMPLATE,
  ENVIRONMENT_DESCRIPTION
} = require("../config");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");

/**
 * Function that returns the status
 *
 * @param {string} statusName The name of status field to return
 *
 * @returns {object} All status values for the specified field name
 */
const getStatus = async statusName => {
  logEmitter.emit("functionCall", "status.service", "getStatus");

  const status = await getStoredStatus();

  logEmitter.emit("functionSuccess", "status.service", "getStatus");

  return statusName ? status[statusName] : status;
};

/**
 * Updates a specified status value
 *
 * @param {string} statusName The status field name
 * @param {any} newStatus The new status value
 *
 * @returns {any} The new status value
 */
const setStatus = async (statusName, newStatus) => {
  logEmitter.emit("functionCall", "status.service", "setStatus");

  const status = await getStoredStatus();
  const currentValue = status[statusName];
  const updatedStatusValue = await updateStoredStatus(statusName, newStatus);

  if (newStatus !== currentValue) {
    let statusText = "Invalid";
    if (newStatus === true) {
      statusText = "Succeeded";
    } else if (newStatus === false) {
      statusText = "Failed";
    }

    let formattedStatusName = getUserFriendlyStatusName(statusName);
    const data = {
      environment_description: ENVIRONMENT_DESCRIPTION,
      status_name:
        formattedStatusName.charAt(0).toUpperCase() +
        formattedStatusName.slice(1),
      status_value: statusText,
      time: new Date().toLocaleString("en-GB", {
        hour12: false,
        timeZone: "Europe/London"
      })
    };

    const emailList = await getEmailDistribution();

    emailList.forEach(emailObject => {
      try {
        sendSingleEmail(NOTIFY_STATUS_TEMPLATE, emailObject.email, data);
      } catch (err) {
        logEmitter.emit("functionFail", "status.service", "setStatus", err);
        throw err;
      }
    });
  }

  logEmitter.emit("functionSuccess", "status.service", "setStatus");

  return updatedStatusValue;
};

/**
 * Function that increments the count value for a status
 *
 * @param {string} statusName The status field name
 *
 * @returns {integer} The new status value
 */

const incrementStatusCount = async statusName => {
  logEmitter.emit("functionCall", "status.service", "incrementStatusCount");

  const status = await getStoredStatus();
  const currentValue = status[statusName];

  if (Number.isInteger(currentValue)) {
    const newValue = currentValue + 1;
    const updatedStatusValue = await updateStoredStatus(statusName, newValue);

    logEmitter.emit(
      "functionSuccess",
      "status.service",
      "incrementStatusCount"
    );

    return updatedStatusValue;
  } else {
    const message = `Status name "${statusName}" is not an integer. Unable to increment.`;

    logEmitter.emit(
      "functionFail",
      "status.service",
      "incrementStatusCount",
      message
    );

    throw new Error(message);
  }
};

/**
 * Function formats status name to be human readable to send in email
 *
 * @param {string} statusName The status  name
 *
 * @returns {string} The formatted status name
 */
const getUserFriendlyStatusName = statusName => {
  return statusName
    .replace("Succeeded", "") // Replace first instance of 'Succeeded' with empty string
    .replace("mostRecent", "") // Replace first instance of 'mostRecent' with empty string
    .replace(/([A-Z])/g, " $1") // Replace all instances of capital letters with itself prefixed with a space (e.g. 'newStatusName' => 'new Status Name')
    .toLowerCase()
    .trim();
};

module.exports = { getStatus, setStatus, incrementStatusCount };
