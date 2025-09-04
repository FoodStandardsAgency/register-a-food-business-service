const { logEmitter } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../cosmos.client");

const findAllFailedNotificationsRegistrations = async (cachedRegistrations, limit = 100) => {
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

const findAllBlankRegistrations = async (cachedRegistrations, limit = 100) => {
  return await cachedRegistrations
    .find({
      $and: [
        { "fsa-rn": { $not: { $regex: /^tmp_/ } } },
        {
          $or: [{ "status.notifications": { $exists: false } }, { "status.notifications": null }]
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

const getStatus = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration.status);
};

const updateStatus = async (cachedRegistrations, fsa_rn, newStatus) => {
  logEmitter.emit("functionCall", "notificationsDb.connector", "updateStatus");
  try {
    await cachedRegistrations.updateOne(
      { "fsa-rn": fsa_rn },
      {
        $set: { status: newStatus }
      }
    );
    logEmitter.emit("functionSuccess", "notificationsDb.connector", "updateStatus");
  } catch (err) {
    logEmitter.emit("functionFail", "notificationsDb.connector", "updateStatus", err);
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
  findAllFailedNotificationsRegistrations,
  findAllBlankRegistrations,
  updateNotificationOnSent,
  getStatus,
  updateStatus
};
