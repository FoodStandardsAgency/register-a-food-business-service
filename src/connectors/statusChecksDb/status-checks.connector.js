"use strict";

const { logEmitter, ERROR } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../cosmos.client");

const findRegistrationByFsaId = async (fsa_rn) => {
  logEmitter.emit("functionCall", "status-checks.connector", "findOneById");

  try {
    const registrations = await establishConnectionToCosmos("registrations", "registrations");
    const registration = await registrations.findOne({
      "fsa-rn": fsa_rn
    });
    logEmitter.emit("functionSuccess", "status-checks.connector", "findOneById");
    return registration;
  } catch (err) {
    logEmitter.emit(ERROR, "Single registration data lookup failure");
    logEmitter.emit("functionFail", "status-checks.connector", "findOneById", err);
    throw err;
  }
};

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

const updateTradingStatusCheck = async (fsa_rn, newStatus) => {
  logEmitter.emit("functionCall", "status-checks.connector", "updateStatus");
  const registrations = await establishConnectionToCosmos("registrations", "registrations");
  try {
    // Get the existing document to check trading_status
    const registration = await registrations.findOne({ "fsa-rn": fsa_rn });

    if (!Array.isArray(registration.trading_status)) {
      // If trading_status doesn't exist or isn't an array, set it as a new array with the new status
      await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        { $set: { trading_status: [newStatus] } },
        { upsert: true }
      );
    } else {
      // Check if an item with same type exists
      const typeIndex = registration.trading_status.findIndex(
        (status) => status.type === newStatus.type
      );

      if (typeIndex >= 0) {
        // Replace the existing item at the found index
        await registrations.updateOne(
          { "fsa-rn": fsa_rn },
          { $set: { [`trading_status.${typeIndex}`]: newStatus } }
        );
      } else {
        // Add the new status to the array
        await registrations.updateOne(
          { "fsa-rn": fsa_rn },
          { $push: { trading_status: newStatus } }
        );
      }
    }

    logEmitter.emit("functionSuccess", "status-checks.connector", "updateStatus");
  } catch (err) {
    logEmitter.emit("functionFail", "status-checks.connector", "updateStatus", err);
  }
};

module.exports = {
  findRegistrationByFsaId,
  findActionableRegistrations,
  updateTradingStatusCheck
};
