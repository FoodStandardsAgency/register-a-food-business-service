"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { processTradingStatus } = require("../../services/status-checks.service");
const { getLaConfigWithAllNotifyAddresses } = require("../../services/laConfig.service");
const { isEmpty } = require("lodash");

const {
  findRegistrationByFsaId,
  findActionableRegistrations,
  updateRegistrationTradingStatus
} = require("../../connectors/statusChecksDb/status-checks.connector");
const { getAllLocalCouncilConfig } = require("../../connectors/configDb/configDb.connector");

/**
 * Processes all due trading status checks for actionable registrations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {number} throttle - Throttle value for processing.
 * @returns {Promise<Array>} Array of results from processing trading status checks.
 */
const processTradingStatusChecksDue = async (req, res, throttle) => {
  logEmitter.emit(
    "functionCall",
    "trading-status-checks.controller",
    "processTradingStatusChecksDue"
  );

  let registrationsCollection = await findActionableRegistrations(throttle);
  let allLaConfigData = await getAllLocalCouncilConfig();

  const result = await processTradingStatusChecks(registrationsCollection, allLaConfigData);

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processTradingStatusChecksDue"
  );

  return result;
};

/**
 * Processes trading status checks for a single registration identified by fsaId.
 *
 * @param {string} fsaId - The registration ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws Will throw an error if the registration is not found.
 */
const processTradingStatusChecksForId = async (fsaId, req, res) => {
  logEmitter.emit(
    "functionCall",
    "trading-status-checks.controller",
    "processTradingStatusChecksForId"
  );
  let allLaConfigData = await getAllLocalCouncilConfig();

  // Get registration for the fsaId
  let registration = await findRegistrationByFsaId(fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  const result = await processTradingStatusChecks([registration], allLaConfigData);

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processTradingStatusChecksForId"
  );

  return result.length && result[0];
};

/**
 * Processes trading status checks for an array of registrations.
 *
 * @param {Array} registrations - Array of registration objects.
 * @param {Array} laConfig - Local authority configuration data.
 * @returns {Promise<Array>} Array of results from processing each trading status.
 */
const processTradingStatusChecks = async (registrations, laConfig) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "processTradingStatusChecks");

  const results = [];
  for (const registration of registrations) {
    try {
      const localCouncil = await getLaConfigWithAllNotifyAddresses(
        registration.local_council_url,
        laConfig
      );

      localCouncil.trading_status.data_retention_period = process.env.DATA_RETENTION_PERIOD || 7;

      logEmitter.emit(
        INFO,
        `Processing registration ${registration["fsa-rn"]} for council ${localCouncil.local_council_url}`
      );

      const result = await processTradingStatus(registration, localCouncil);
      results.push(result);
    } catch (error) {
      let message = `Processing registration ${registration["fsa-rn"]} for council failed: ${error.message}`;
      logEmitter.emit(ERROR, message);
      results.push({ fsaId: registration["fsa-rn"], error: message });
    }
  }

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processTradingStatusChecks"
  );

  return results;
};

/**
 * Updates the registration to indicate business confirmed still trading.
 *
 * @param {string} fsaId - The registration ID.
 * @param {string} encryptedId - The encrypted record ID of the registration.
 */
const processFboConfirmedTrading = async (fsaId, encryptedId) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "processFboConfirmedTrading");

  const result = await updateRegistrationTradingStatus(fsaId, encryptedId, false);

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processFboConfirmedTrading"
  );

  return result;
};

/**
 * Updates the registration to indicate business stopped trading.
 *
 * @param {string} fsaId - The registration ID.
 * @param {string} encryptedId - The encrypted record ID of the registration.
 */
const processFboStoppedTrading = async (fsaId, encryptedId) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "processFboStoppedTrading");

  const result = await updateRegistrationTradingStatus(fsaId, encryptedId, true);

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processFboStoppedTrading"
  );

  return result;
};

module.exports = {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId,
  processFboConfirmedTrading,
  processFboStoppedTrading
};
