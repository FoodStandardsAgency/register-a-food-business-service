const {
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration
} = require("../../db/db");
const { info, error } = require("winston");

const modelCreate = async (data, model, modelName) => {
  info(`Function: create${modelName} called`);
  try {
    const response = await model.create(data);
    info(`Function: create${modelName} successful`);
    return response;
  } catch (err) {
    error(`Function: create${modelName} failed with error: ${err}`);
    return err;
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

const createRegistration = async registration => {
  return modelCreate(registration, Registration, "Registration");
};

const modelFindOne = async (query, model, functionName) => {
  info(`Function: ${functionName} called`);
  try {
    const response = await model.findOne(query);
    info(`Function: ${functionName} successful`);
    return response;
  } catch (err) {
    info(`Function ${functionName} failed with error: ${err}`);
    return err;
  }
};

const getRegistrationById = async id => {
  return modelFindOne(
    { where: { id: id } },
    Registration,
    "getRegistrationByRegId"
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
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId
};
