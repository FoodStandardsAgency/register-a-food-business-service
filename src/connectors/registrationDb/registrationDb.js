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
    info(`Function: create${modelName} called`);
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

module.exports = {
  createActivities,
  createEstablishment,
  createMetadata,
  createOperator,
  createPremise,
  createRegistration
};
