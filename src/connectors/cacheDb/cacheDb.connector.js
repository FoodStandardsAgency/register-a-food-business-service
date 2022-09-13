const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const { establishConnectionToCosmos } = require("../cosmos.client");

const cacheRegistration = async (registration) => {
  logEmitter.emit("functionCall", "cacheDb.connector", "cacheRegistration");
  try {
    const cachedRegistrations = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    const response = await cachedRegistrations.insertOne(registration);

    statusEmitter.emit("incrementCount", "storeRegistrationsInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentRegistrationInCacheSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "cacheRegistration"
    );

    return response;
  } catch (err) {
    statusEmitter.emit("incrementCount", "storeRegistrationsInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentRegistrationInCacheSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "cacheRegistration",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
};

/**
 * Update the completed objects for the Registration and Tascomi objects
 * @param {string} fsa_rn The FSA-RN for the registration to be updated
 * @param {string} property The specific field to be updated
 * @param {boolean} value The value for the result
 */
const updateStatusInCache = async (fsa_rn, property, value) => {
  logEmitter.emit("functionCall", "cacheDb.connector", "updateStatusInCache");
  try {
    const cachedRegistrations = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );
    const status = await getStatus(cachedRegistrations, fsa_rn);

    status[property] = {
      time: new Date(),
      complete: value
    };

    await updateStatus(cachedRegistrations, fsa_rn, status);

    statusEmitter.emit("incrementCount", "updateStatusInCacheSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateStatusInCacheSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "cacheDb.connector",
      "updateStatusInCache"
    );
  } catch (err) {
    statusEmitter.emit("incrementCount", "updateStatusInCacheFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentUpdateStatusInCacheSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "cacheDb.connector",
      "updateStatusInCache",
      err
    );
  }
};

const findAllFailedNotificationsRegistrations = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find({
      $and: [
        { "fsa-rn": { $not: { $regex: /^tmp_/ } } },
        {
          "status.notifications": {
            $elemMatch: { sent: { $ne: true } }
          }
        },
        {
          $or: [
            { direct_submission: { $exists: false } },
            { direct_submission: null },
            { direct_submission: false }
          ]
        }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findAllTmpRegistrations = async (cachedRegistrations, limit = 100) => {
  return await cachedRegistrations
    .find({
      $and: [
        { "fsa-rn": { $regex: /^tmp_/ } },
        {
          $or: [
            { direct_submission: { $exists: false } },
            { direct_submission: null },
            { direct_submission: false }
          ]
        }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findAllBlankRegistrations = async (cachedRegistrations, limit = 100) => {
  return await cachedRegistrations
    .find({
      $and: [
        { "fsa-rn": { $not: { $regex: /^tmp_/ } } },
        {
          $or: [
            { "status.notifications": { $exists: false } },
            { "status.notifications": null }
          ]
        },
        {
          $or: [
            { direct_submission: { $exists: false } },
            { direct_submission: null },
            { direct_submission: false }
          ]
        }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findOutstandingTascomiRegistrationsFsaIds = async (
  cachedRegistrations,
  limit = 100
) => {
  return await cachedRegistrations
    .find({
      $and: [
        { "status.tascomi": { $exists: true } },
        { "status.tascomi.complete": { $ne: true } },
        {
          $or: [
            { direct_submission: { $exists: false } },
            { direct_submission: null },
            { direct_submission: false }
          ]
        }
      ]
    })
    .sort({ reg_submission_date: 1 })
    .limit(limit);
};

const findOneById = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration);
};

const getStatus = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration.status);
};

const updateStatus = async (cachedRegistrations, fsa_rn, newStatus) => {
  logEmitter.emit("functionCall", "cacheDb.connector", "updateStatus");
  try {
    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { status: newStatus }
      }
    );
    logEmitter.emit("functionSuccess", "cacheDb.connector", "updateStatus");
  } catch (err) {
    logEmitter.emit("functionFail", "cacheDb.connector", "updateStatus", err);
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
const updateNotificationOnSent = (
  status,
  fsa_rn,
  emailsToSend,
  index,
  sent,
  date = null
) => {
  logEmitter.emit(
    "functionCall",
    "cacheDb.connector",
    "updateNotificationOnSent"
  );
  let { type, address } = emailsToSend[index];
  date = date === null ? new Date() : date;
  status.notifications[index].address = address;
  status.notifications[index].type = type;
  status.notifications[index].time = date;
  status.notifications[index].sent = sent;

  logEmitter.emit(
    "functionSuccess",
    "cacheDb.connector",
    "updateNotificationOnSent"
  );

  return status;
};

module.exports = {
  findAllFailedNotificationsRegistrations,
  findAllTmpRegistrations,
  findAllBlankRegistrations,
  findOutstandingTascomiRegistrationsFsaIds,
  cacheRegistration,
  updateStatusInCache,
  updateNotificationOnSent,
  findOneById,
  getStatus,
  updateStatus
};
