const { logEmitter } = require("../../services/logging.service");
const { establishConnectionToCosmos } = require("../cosmos.client");

const saveRegistration = async (registration) => {
  logEmitter.emit("functionCall", "submissionsDb.connector", "saveRegistration");
  try {
    const cachedRegistrations = await establishConnectionToCosmos("registrations", "registrations");
    const response = await cachedRegistrations.insertOne(registration);

    logEmitter.emit("functionSuccess", "submissionsDb.connector", "saveRegistration");

    return response;
  } catch (err) {
    logEmitter.emit("functionFail", "submissionsDb.connector", "saveRegistration", err);

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
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

const findOneById = async (cachedRegistrations, fsa_rn) => {
  const cachedRegistration = await cachedRegistrations.findOne({
    "fsa-rn": fsa_rn
  });
  return Object.assign({}, cachedRegistration);
};

module.exports = {
  findAllTmpRegistrations,
  saveRegistration,
  findOneById
};
