"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const {
  getTradingStatusAction,
  processTradingStatusChecks
} = require("../../services/status-checks.service");
const { isEmpty } = require("lodash");
const { success } = require("../../utils/express/response");

const {
  findActionableRegistrations
} = require("../../connectors/notificationsDb/notificationsDb.connector");
const { findOneById } = require("../../connectors/submissionsDb/submissionsDb.connector");
const { getAllLocalCouncilConfig } = require("../../connectors/configDb/configDb.connector");

const processTradingStatusChecks = async (req, res, throttle) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "processTradingStatusChecks");
  let idsAttempted = [];
  let registrationsCollection = await establishConnectionToCosmos("registrations", "registrations");
  let allLcConfigData = await getAllLocalCouncilConfig();
  return processTradingStatusChecks();
};

const processTradingStatusChecksForId = async (fsaId, req, res) => {
  logEmitter.emit(
    "functionCall",
    "trading-status-checks.controller",
    "sendNotificationsForRegistrationAction"
  );
  let allLcConfigData = await getAllLocalCouncilConfig();

  //GET REGISTRATION
  let registration = await getRegistration(fsaId);

  if (isEmpty(registration)) {
    let message = `Could not find registration with ID ${fsaId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }
  logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

  //GET LOCAL COUNCIL
  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = findCouncilByIdInArray(localCouncilId, allLcConfigData);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLcConfigData
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find local council config ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  await sendNotifications(fsaId, lcContactConfig, registration);

  logEmitter.emit(INFO, `Send notifications for ${fsaId}`);
  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "sendNotificationsForRegistrationAction"
  );

  await success(res, { fsaId, message: `Updated notifications status` });
};

// Convenience methods for this controller - dont put else where
const multiSendNotifications = async (registration, allLocalCouncils) => {
  let fsaId = registration["fsa-rn"];

  let localCouncilId = getLocalCouncilIdForRegistration(registration);
  let localCouncil = await findCouncilByIdInArray(localCouncilId, allLocalCouncils);
  if (isEmpty(localCouncil)) {
    let message = `Could not find local council with ID ${localCouncilId}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  //this method is in dire need of refactoring...
  let lcContactConfig = await getLcContactConfigFromArray(
    localCouncil.local_council_url,
    allLocalCouncils
  );
  if (isEmpty(lcContactConfig)) {
    let message = `Could not find lcContactConfig ${fsaId} ${localCouncil.local_council_url}`;
    logEmitter.emit(ERROR, message);
    throw new Error(`${message}`);
  }

  await sendNotifications(fsaId, lcContactConfig, registration);
};

const getRegistration = async (fsaId) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "getRegistration");
  const cachedRegistrations = await establishConnectionToCosmos("registrations", "registrations");
  logEmitter.emit("functionSuccess", "trading-status-checks.controller", "getRegistration");
  return await findOneById(cachedRegistrations, fsaId);
};

// const getCouncilFromConfigDb = async (client, registration) => {
//   //this is a strange nasty hack to extract the council id of the initial registration for older records
//   const lcConfigCollection = await LocalCouncilConfigDbCollection(client);
//   let councilId;
//   if (registration.source_council_id) {
//     // POST feature RS-79
//     councilId = registration.source_council_id;
//   } else {
//     // PRE feature RS-79
//     councilId = registration.hygieneAndStandards
//       ? registration.hygieneAndStandards.code
//       : registration.hygiene.code;
//   }
//
//   //can return null
//   return await findCouncilById(lcConfigCollection, councilId);
// };

const findCouncilByIdInArray = (id, allCouncils = []) => {
  logEmitter.emit("functionCall", "trading-status-checks.controller", "findCouncilByIdInArray");
  let out = allCouncils.find((council) => council._id === id);
  logEmitter.emit("functionSuccess", "trading-status-checks.controller", "findCouncilByIdInArray");
  return out;
};

const getLocalCouncilIdForRegistration = (registration) => {
  logEmitter.emit(
    "functionCall",
    "trading-status-checks.controller",
    "getLocalCouncilIdForRegistration"
  );
  let councilId;

  if (registration.source_council_id) {
    // POST feature RS-79
    councilId = registration.source_council_id;
  } else {
    // PRE feature RS-79
    councilId = registration.hygieneAndStandards
      ? registration.hygieneAndStandards.code
      : registration.hygiene.code;
  }

  logEmitter.emit(
    "functionSuccess",
    "trading-status-checks.controller",
    "getLocalCouncilIdForRegistration"
  );

  return councilId;
};

module.exports = {
  processTradingStatusChecks,
  processTradingStatusChecksForId
};
