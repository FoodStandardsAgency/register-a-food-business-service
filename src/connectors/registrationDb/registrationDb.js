const {
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration
} = require("../../db/db");
const { logEmitter } = require("../../services/logging.service");

const modelCreate = async (data, model, modelName) => {
  logEmitter.emit(
    "functionCall",
    "registration.connector.js",
    `create${modelName}`
  );
  try {
    const response = await model.create(data);
    logEmitter.emit(
      "functionSuccess",
      "registration.connector.js",
      `create${modelName}`
    );
    return response;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "registration.connector.js",
      `create${modelName}`,
      err
    );
    throw err;
  }
};

const createActivities = async (activities, establishmentId) => {
  const data = Object.assign(activities, { establishmentId });
  return modelCreate(data, Activities, "Activities");
};

const createEstablishment = async (establishment, registrationId) => {
  const data = Object.assign(establishment, { registrationId });
  return modelCreate(data, Establishment, "Establishment");
};

const createMetadata = async (metadata, registrationId) => {
  const data = Object.assign(metadata, { registrationId });
  return modelCreate(data, Metadata, "Metadata");
};

const createOperator = async (operator, establishmentId) => {
  const data = Object.assign(operator, { establishmentId });
  return modelCreate(data, Operator, "Operator");
};

const createPremise = async (premise, establishmentId) => {
  const data = Object.assign(premise, { establishmentId });
  return modelCreate(data, Premise, "Premise");
};

const createRegistration = async fsa_rn => {
  return modelCreate({ fsa_rn }, Registration, "Registration");
};

const modelFindOne = async (query, model, functionName) => {
  logEmitter.emit("functionCall", "registration.connector.js", functionName);
  try {
    const response = await model.findOne(query);
    logEmitter.emit(
      "functionSuccess",
      "registration.connector.js",
      functionName
    );
    return response;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "registration.connector.js",
      functionName,
      err
    );
    throw err;
  }
};

const getRegistrationById = async id => {
  return modelFindOne(
    { where: { id: id } },
    Registration,
    "getRegistrationByRegId"
  );
};

const getRegistrationByFsaRn = async fsa_rn => {
  return modelFindOne(
    { where: { fsa_rn: fsa_rn } },
    Registration,
    "getRegistrationByFsaRn"
  );
};

const getEstablishmentByRegId = async id => {
  return modelFindOne(
    { where: { registrationId: id } },
    Establishment,
    "getEstablishmentByRegId"
  );
};

const getMetadataByRegId = async id => {
  return modelFindOne(
    { where: { registrationId: id } },
    Metadata,
    "getMetadataByRegId"
  );
};

const getOperatorByEstablishmentId = async id => {
  return modelFindOne(
    { where: { establishmentId: id } },
    Operator,
    "getOperatorByEstablishmentId"
  );
};

const getPremiseByEstablishmentId = async id => {
  return modelFindOne(
    { where: { establishmentId: id } },
    Premise,
    "getPremiseByEstablishmentId"
  );
};

const getActivitiesByEstablishmentId = async id => {
  return modelFindOne(
    { where: { establishmentId: id } },
    Activities,
    "getActivitiesByEstablishmentId"
  );
};

module.exports = {
  createActivities,
  createEstablishment,
  createMetadata,
  createOperator,
  createPremise,
  createRegistration,
  getRegistrationById,
  getRegistrationByFsaRn,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId
};
