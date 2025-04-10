"use strict";

const { logEmitter, ERROR } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../cosmos.client");

/**
 * Finds actionable registrations that are due for a status check.
 *
 * @param {number} [limit=50] - Maximum number of registrations to retrieve.
 * @returns {Promise<Array>} Array of actionable registrations.
 * @throws Will throw an error if registration lookup fails.
 */
const findActionableRegistrations = async (limit = 50) => {
  logEmitter.emit("functionCall", "status-checks.connector", "findActionableRegistrations");

  try {
    const registrations = await establishConnectionToCosmos("registrations", "registrations");
    const actionableRegistrations = await registrations
      .find({ next_status_date: { $lte: new Date() } })
      .limit(limit)
      .toArray();
    logEmitter.emit("functionSuccess", "status-checks.connector", "findActionableRegistrations");
    return actionableRegistrations;
  } catch (err) {
    logEmitter.emit(ERROR, "Registration data lookup failure");
    logEmitter.emit("functionFail", "status-checks.connector", "findActionableRegistrations", err);
    throw err;
  }
};

const updateStatus = async (cachedRegistrations, fsa_rn, newStatus) => {
  logEmitter.emit("functionCall", "status-checks.connector", "updateStatus");
  try {
    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { trading_status: newStatus }
      }
    );
    logEmitter.emit("functionSuccess", "status-checks.connector", "updateStatus");
  } catch (err) {
    logEmitter.emit("functionFail", "status-checks.connector", "updateStatus", err);
  }
};

/**
 * Updates a specific notification when sent, finding the notification status from the type and address and updating the time and result fields
 * @param status
 * @param {string} fsa_rn The FSA-RN number for the registration to be updated
 * @param emailsToSend
 * @param index The index of the email - we need this to make sure we update the right item if the same email address has been used multiple times.
 * @param sent
 * @param date
 */
const updateNotificationOnSent = (status, fsa_rn, emailsToSend, index, sent, date = null) => {
  logEmitter.emit("functionCall", "notificationsDb.connector", "updateNotificationOnSent");
  let { type, address } = emailsToSend[index];
  status.notifications[index].address = address;
  status.notifications[index].type = type;
  status.notifications[index].time = date || new Date();
  status.notifications[index].sent = sent;

  logEmitter.emit("functionSuccess", "notificationsDb.connector", "updateNotificationOnSent");

  return status;
};

module.exports = {
  findActionableRegistrations,
  updateNotificationOnSent,
  updateStatus
};
