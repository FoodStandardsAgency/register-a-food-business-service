const promiseRetry = require("promise-retry");
const {
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration,
  Partner
} = require("../../db/db");
const { logEmitter } = require("../../services/logging.service");

const modelCreate = async (data, model, modelName) => {
  try {
    const response = await promiseRetry({ retries: 3 }, (retry, number) => {
      logEmitter.emit(
        "functionCall",
        "registration.connector.js",
        `create${modelName} attempt ${number}`
      );
      return model.create(data).catch(retry);
    });
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
  const data = Object.assign({}, activities, { establishmentId });
  return modelCreate(data, Activities, "Activities");
};

const createEstablishment = async (establishment, registrationId) => {
  const data = Object.assign({}, establishment, { registrationId });
  return modelCreate(data, Establishment, "Establishment");
};

const createMetadata = async (metadata, registrationId) => {
  const data = Object.assign({}, metadata, { registrationId });
  return modelCreate(data, Metadata, "Metadata");
};

const createOperator = async (operator, establishmentId) => {
  const data = Object.assign({}, operator, { establishmentId });
  return modelCreate(data, Operator, "Operator");
};

const createPartner = async (partner, operatorId) => {
  const data = Object.assign({}, partner, { operatorId });
  return modelCreate(data, Partner, "Partner");
};

const createPremise = async (premise, establishmentId) => {
  const data = Object.assign({}, premise, { establishmentId });
  return modelCreate(data, Premise, "Premise");
};

const createRegistration = async (fsa_rn, council) => {
  const data = { fsa_rn, council };
  return modelCreate(data, Registration, "Registration");
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

const modelDestroy = async (query, model, functionName) => {
  logEmitter.emit("functionCall", "registration.connector.js", functionName);
  try {
    const response = await model.destroy(query);
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

const destroyRegistrationById = async id => {
  return modelDestroy(
    { where: { id: id } },
    Registration,
    "destroyRegistrationByRegId"
  );
};

const destroyEstablishmentByRegId = async id => {
  return modelDestroy(
    { where: { registrationId: id } },
    Establishment,
    "destroyEstablishmentByRegId"
  );
};

const destroyMetadataByRegId = async id => {
  return modelDestroy(
    { where: { registrationId: id } },
    Metadata,
    "destroyMetadataByRegId"
  );
};

const destroyOperatorByEstablishmentId = async id => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Operator,
    "destroyOperatorByEstablishmentId"
  );
};

const destroyPremiseByEstablishmentId = async id => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Premise,
    "destroyPremiseByEstablishmentId"
  );
};

const destroyActivitiesByEstablishmentId = async id => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Activities,
    "destroyActivitiesByEstablishmentId"
  );
};

module.exports = {
  createActivities,
  createEstablishment,
  createMetadata,
  createOperator,
  createPremise,
  createPartner,
  createRegistration,
  getRegistrationById,
  getRegistrationByFsaRn,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId,
  destroyRegistrationById,
  destroyEstablishmentByRegId,
  destroyMetadataByRegId,
  destroyOperatorByEstablishmentId,
  destroyPremiseByEstablishmentId,
  destroyActivitiesByEstablishmentId
};
