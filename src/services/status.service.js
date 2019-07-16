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
const { NOTIFY_STATUS_TEMPLATE, ENVIRONMENT_DESCRIPTION } = require("../config");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");

/**
 * Function that returns the status
 *
 * @param {string} statusName The name of status field to return
 *
 * @returns {object} All status values for the specified field name
 */
const getStatus = async statusName => {
  logEmitter.emit(
    "functionCall",
    "status.service",
    "getStatus"
  );

  const status = await getStoredStatus();
  
  logEmitter.emit(
    "functionSuccess",
    "status.service",
    "getStatus"
  );

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
  logEmitter.emit(
    "functionCall",
    "status.service",
    "setStatus"
  );

  const status = await getStoredStatus();
  const currentValue = status[statusName];
  const updatedStatusValue = await updateStoredStatus(statusName, newStatus);

  if(newStatus !== currentValue) {
    let statusText = "Invalid";
    if(newStatus === true) {
      statusText = "Succeeded";
    } else if(newStatus === false) {
      statusText = "Failed";
    }
    statusName = statusName.replace('Succeeded','').replace('mostRecent','').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    const data = {
        environment_description: ENVIRONMENT_DESCRIPTION,
        status_name: statusName.charAt(0).toUpperCase() + statusName.slice(1),
        status_value: statusText,
        time: new Date().toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London'})
    };
    
    const emailList = await getEmailDistribution();

    emailList.forEach(function (item) {
      try {
        sendSingleEmail(NOTIFY_STATUS_TEMPLATE, item.email, data);
      } catch (err) {
        logEmitter.emit(
          "functionFail",
          "status.service",
          "setStatus",
          err
        );

        throw err;
      };
    });
    
  }

  logEmitter.emit(
    "functionSuccess",
    "status.service",
    "setStatus"
  );

  return updatedStatusValue;
};

/**
 * Function that increments the count value for a status
 *
 * @param {string} statusName The status field name
 *
 * @returns {any} The new status value
 */

const incrementStatusCount = async statusName => {
  logEmitter.emit(
    "functionCall",
    "status.service",
    "incrementStatusCount"
  );

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

module.exports = { getStatus, setStatus, incrementStatusCount };
