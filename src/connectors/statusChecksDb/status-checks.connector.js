"use strict";

const { logEmitter, ERROR } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../cosmos.client");
const { decryptId } = require("../../utils/crypto");

const findRegistrationByFsaId = async (fsa_rn) => {
  logEmitter.emit("functionCall", "status-checks.connector", "findRegistrationByFsaId");

  try {
    const registrations = await establishConnectionToCosmos("registrations", "registrations");
    const registration = await registrations.findOne({
      "fsa-rn": fsa_rn
    });
    logEmitter.emit("functionSuccess", "status-checks.connector", "findRegistrationByFsaId");
    return registration;
  } catch (err) {
    logEmitter.emit(ERROR, "Single registration data lookup failure");
    logEmitter.emit("functionFail", "status-checks.connector", "findRegistrationByFsaId", err);
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
      .find({ next_status_check: { $lte: new Date() } })
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
  logEmitter.emit("functionCall", "status-checks.connector", "updateTradingStatusCheck");
  const registrations = await establishConnectionToCosmos("registrations", "registrations");
  try {
    // Get the existing document to check trading_status
    const registration = await registrations.findOne({ "fsa-rn": fsa_rn });

    if (!registration) {
      throw new Error(`Registration with ID ${fsa_rn} not found`);
    }

    if (!Array.isArray(registration.status?.trading_status_checks)) {
      // If trading_status doesn't exist or isn't an array, set it as a new array with the new status
      await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        { $set: { "status.trading_status_checks": [newStatus] } },
        { upsert: true }
      );
    } else {
      // Check if an item with same type exists
      const typeIndex = registration.status.trading_status_checks.findIndex(
        (status) => status.type === newStatus.type
      );

      if (typeIndex >= 0) {
        // Replace the existing item at the found index
        await registrations.updateOne(
          { "fsa-rn": fsa_rn },
          { $set: { [`status.trading_status_checks.${typeIndex}`]: newStatus } }
        );
      } else {
        // Add the new status to the array
        await registrations.updateOne(
          { "fsa-rn": fsa_rn },
          { $push: { "status.trading_status_checks": newStatus } }
        );
      }
    }

    logEmitter.emit("functionSuccess", "status-checks.connector", "updateTradingStatusCheck");
  } catch (err) {
    logEmitter.emit("functionFail", "status-checks.connector", "updateTradingStatusCheck", err);
    throw err;
  }
};

/**
 * Updates the next_status_check for a registration with the given fsa_rn.
 *
 * @param {string} fsa_rn - The FSA registration number of the registration to update.
 * @param {string} nextStatusDate - The new next_status_check value (moment object).
 * @returns {Promise<void>}
 * @throws Will throw an error if registration is not found or update fails.
 */
const updateNextStatusDate = async (fsa_rn, nextStatusDate) => {
  logEmitter.emit("functionCall", "status-checks.connector", "updateNextStatusDate");
  const registrations = await establishConnectionToCosmos("registrations", "registrations");

  try {
    // Get the existing document to check if it exists
    const registration = await registrations.findOne({ "fsa-rn": fsa_rn });

    if (!registration) {
      throw new Error(`Registration with ID ${fsa_rn} not found`);
    }

    // Update only the next_status_check field
    if (!nextStatusDate) {
      const result = await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        { $unset: { next_status_check: "" } }
      );
      if (result.matchedCount === 0) {
        throw new Error(`No document matched for fsa-rn: ${fsa_rn}`);
      } else if (result.modifiedCount === 0) {
        throw new Error(`Document found but field not modified for fsa-rn: ${fsa_rn}`);
      }
    } else {
      await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        { $set: { next_status_check: nextStatusDate.toDate() } }
      );
    }

    logEmitter.emit("functionSuccess", "status-checks.connector", "updateNextStatusDate");
  } catch (err) {
    logEmitter.emit(ERROR, "Failed to update next_status_check");
    logEmitter.emit("functionFail", "status-checks.connector", "updateNextStatusDate", err);
    throw err;
  }
};

/**
 * Updates registration with the given fsa_rn to indicate either FBO stopped trading or confirmed still trading.
 *
 * @param {string} fsa_rn - The FSA registration number of the registration to update.
 * @param {string} encryptedId - The encrypted record ID of the registration.
 * @param {string} stoppedTrading - FBO confirmed stopped trading?
 * @returns {Promise<void>}
 * @throws Will throw an error if registration is not found or update fails.
 */
const updateRegistrationTradingStatus = async (fsa_rn, encryptedId, stoppedTrading) => {
  logEmitter.emit("functionCall", "status-checks.connector", "updateRegistrationTradingStatus");
  const registrations = await establishConnectionToCosmos("registrations", "registrations");

  try {
    // Get the existing document to check if it exists
    const registration = await registrations.findOne({ "fsa-rn": fsa_rn });

    if (!registration) {
      throw new Error(`Registration with ID ${fsa_rn} not found`);
    }

    const id = decryptId(encryptedId);
    if (!id || id !== registration._id.toString()) {
      throw new Error(`Invalid encrypted ID: ${encryptedId}`);
    }

    if (stoppedTrading) {
      await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        {
          $set: {
            confirmed_not_trading: new Date(),
            next_status_check: new Date() // Will be processed overnight to set next action based on LA config
          }
        }
      );
    } else {
      await registrations.updateOne(
        { "fsa-rn": fsa_rn },
        {
          $set: {
            last_confirmed_trading: new Date(),
            next_status_check: new Date(), // Will be processed overnight to set next action based on LA config
            confirmed_not_trading: null
          }
        }
      );
    }

    logEmitter.emit(
      "functionSuccess",
      "status-checks.connector",
      "updateRegistrationTradingStatus"
    );
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "status-checks.connector",
      "updateRegistrationTradingStatus",
      err
    );
    throw err;
  }
};

/**
 * Deletes a registration with the given fsa_rn.
 *
 * @param {string} fsa_rn - The FSA registration number of the registration to delete.
 * @returns {Promise<void>}
 * @throws Will throw an error if registration is not found or delete fails.
 */
const deleteRegistration = async (fsa_rn) => {
  logEmitter.emit("functionCall", "status-checks.connector", "deleteRegistration");
  const registrations = await establishConnectionToCosmos("registrations", "registrations");

  try {
    // Get the existing document to check if it exists
    const registration = await registrations.findOne({ "fsa-rn": fsa_rn });

    if (!registration) {
      throw new Error(`Registration with ID ${fsa_rn} not found`);
    }

    // Actually delete the registration
    await registrations.deleteOne({ "fsa-rn": fsa_rn });

    logEmitter.emit("functionSuccess", "status-checks.connector", "deleteRegistration");
  } catch (err) {
    logEmitter.emit("functionFail", "status-checks.connector", "deleteRegistration", err);
    throw err;
  }
};

module.exports = {
  findRegistrationByFsaId,
  findActionableRegistrations,
  updateTradingStatusCheck,
  updateNextStatusDate,
  updateRegistrationTradingStatus,
  deleteRegistration
};
