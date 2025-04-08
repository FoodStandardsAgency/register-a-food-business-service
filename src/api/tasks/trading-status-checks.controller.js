"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { processTradingStatus } = require("../../services/status-checks.service");
const { isEmpty } = require("lodash");

const {
  findActionableRegistrations
} = require("../../connectors/statusChecksDb/status-checks.connector");
const { findOneById } = require("../../connectors/submissionsDb/submissionsDb.connector");
const {
  getAllLocalCouncilConfig,
  findCouncilByUrl
} = require("../../connectors/configDb/configDb.connector");

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

  const result = processTradingStatusChecks(registrationsCollection, allLaConfigData);

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
  let registration = await getRegistration(fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  await processTradingStatusChecks([registration], allLaConfigData);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);
  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processTradingStatusChecksForId"
  );
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
    let localCouncil = findCouncilByUrl(laConfig, registration.local_council_url);

    if (!localCouncil) {
      let message = `Could not find local council config for registration ${registration.fsa_rn} with url ${registration.local_council_url}`;
      logEmitter.emit(ERROR, message);
      continue;
    }

    // Add data retention period from environment variable
    localCouncil.data_retention_period = process.env.DATA_RETENTION_PERIOD || 7;

    logEmitter.emit(
      INFO,
      `Processing registration ${registration.fsa_rn} for council ${localCouncil.local_council_url}`
    );

    const result = await processTradingStatus(registration, localCouncil);
    results.push(result);
  }

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "processTradingStatusChecks"
  );

  return results;
};

module.exports = {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId
};
