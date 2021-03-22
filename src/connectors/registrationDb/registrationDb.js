"use strict";
const {
  Activities,
  Establishment,
  Declaration,
  Operator,
  Premise,
  Registration,
  Partner
} = require("../../db/db");

const db = require("../../db/models");

const { logEmitter } = require("../../services/logging.service");

const managedTransaction = async (callback = () => {}) => async () =>
  await db.sequelize.transaction(async (t) => callback(t));

const modelCreate = async (data, model, modelName, transaction = null) => {
  try {
    let options = transaction === null ? {} : { transaction };

    const response = model.create(data, options);

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

const createActivities = async (
  activities,
  establishmentId,
  transaction = null
) => {
  const data = Object.assign({}, activities, { establishmentId });
  return modelCreate(data, Activities, "Activities", transaction);
};

const createEstablishment = async (
  establishment,
  registrationId,
  transaction = null
) => {
  const data = Object.assign({}, establishment, { registrationId });
  return modelCreate(data, Establishment, "Establishment", transaction);
};

const createDeclaration = async (
  declaration,
  registrationId,
  transaction = null
) => {
  const data = Object.assign({}, declaration, { registrationId });
  return modelCreate(data, Declaration, "Declaration", transaction);
};

const createOperator = async (
  operator,
  establishmentId,
  transaction = null
) => {
  const data = Object.assign({}, operator, { establishmentId });
  return modelCreate(data, Operator, "Operator", transaction);
};

const createPartner = async (partner, operatorId, transaction = null) => {
  const data = Object.assign({}, partner, { operatorId });
  return modelCreate(data, Partner, "Partner", transaction);
};

const createPremise = async (premise, establishmentId, transaction = null) => {
  const data = Object.assign({}, premise, { establishmentId });
  return modelCreate(data, Premise, "Premise", transaction);
};

const createRegistration = async (
  fsa_rn,
  council,
  direct_submission,
  transaction = null
) => {
  const data = { fsa_rn, council, direct_submission };
  return modelCreate(data, Registration, "Registration", transaction);
};

const modelFindOne = async (query, model, functionName, transaction = null) => {
  logEmitter.emit("functionCall", "registration.connector.js", functionName);

  let t = Object.assign({}, query, { transaction });
  try {
    const response = await model.findOne(t);
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

const modelFindAll = async (query, model, functionName, transaction = null) => {
  logEmitter.emit("functionCall", "registration.connector.js", functionName);

  let t = Object.assign({}, query, { transaction });
  try {
    const response = await model.findAll(t);
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
      "registrationFindAll",
      err
    );
    throw err;
  }
};

const getAllRegistrations = async () => {
  return modelFindAll({}, Registration, "getAllRegistrations");
};

const getAllRegistrationRNs = async () => {
  return modelFindAll(
    {
      attributes: ["fsa_rn"]
    },
    Registration,
    "getAllRegistrationRNs"
  );
};

const getAllPartnersByOperatorId = async (id) => {
  return modelFindAll(
    {
      where: { operatorId: id },
      attributes: {
        exclude: ["createdAt", "updatedAt", "id", "operatorId"]
      }
    },
    Partner,
    "getAllPartners"
  );
};

const getRegistrationById = async (id) => {
  return modelFindOne(
    { where: { id: id } },
    Registration,
    "getRegistrationByRegId"
  );
};

const getRegistrationByFsaRn = async (fsa_rn, transaction) => {
  return modelFindOne(
    { where: { fsa_rn: fsa_rn } },
    Registration,
    "getRegistrationByFsaRn",
    transaction
  );
};

const getEstablishmentByRegId = async (id) => {
  return modelFindOne(
    {
      where: { registrationId: id },
      attributes: {
        exclude: ["createdAt", "updatedAt", "registrationId"]
      }
    },
    Establishment,
    "getEstablishmentByRegId"
  );
};

const getDeclarationByRegId = async (id) => {
  return modelFindOne(
    {
      where: { registrationId: id },
      attributes: {
        exclude: ["id", "registrationId", "createdAt", "updatedAt"]
      }
    },
    Declaration,
    "getDeclarationByRegId"
  );
};

const getOperatorByEstablishmentId = async (id) => {
  return modelFindOne(
    {
      where: { establishmentId: id },
      // include: [
      //   {
      //     model: Partner,
      //     as: "partners"
      //   }
      // ],
      attributes: {
        exclude: ["establishmentId", "createdAt", "updatedAt"]
      }
    },
    Operator,
    "getOperatorByEstablishmentId"
  );
};

const getPremiseByEstablishmentId = async (id) => {
  return modelFindOne(
    {
      where: { establishmentId: id },
      attributes: {
        exclude: ["id", "establishmentId", "createdAt", "updatedAt"]
      }
    },
    Premise,
    "getPremiseByEstablishmentId"
  );
};

const getActivitiesByEstablishmentId = async (id) => {
  return modelFindOne(
    {
      where: { establishmentId: id },
      attributes: {
        exclude: ["id", "establishmentId", "createdAt", "updatedAt"]
      }
    },
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

const destroyRegistrationById = async (id) => {
  return modelDestroy(
    { where: { id: id } },
    Registration,
    "destroyRegistrationByRegId"
  );
};

const destroyEstablishmentByRegId = async (id) => {
  return modelDestroy(
    { where: { registrationId: id } },
    Establishment,
    "destroyEstablishmentByRegId"
  );
};

const destroyDeclarationByRegId = async (id) => {
  return modelDestroy(
    { where: { registrationId: id } },
    Declaration,
    "destroyDeclarationByRegId"
  );
};

const destroyOperatorByEstablishmentId = async (id) => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Operator,
    "destroyOperatorByEstablishmentId"
  );
};

const destroyPremiseByEstablishmentId = async (id) => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Premise,
    "destroyPremiseByEstablishmentId"
  );
};

const destroyActivitiesByEstablishmentId = async (id) => {
  return modelDestroy(
    { where: { establishmentId: id } },
    Activities,
    "destroyActivitiesByEstablishmentId"
  );
};

module.exports = {
  managedTransaction,
  createActivities,
  createEstablishment,
  createDeclaration,
  createOperator,
  createPremise,
  createPartner,
  createRegistration,
  getRegistrationById,
  getRegistrationByFsaRn,
  getEstablishmentByRegId,
  getDeclarationByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId,
  destroyRegistrationById,
  destroyEstablishmentByRegId,
  destroyDeclarationByRegId,
  destroyOperatorByEstablishmentId,
  destroyPremiseByEstablishmentId,
  destroyActivitiesByEstablishmentId,
  getAllPartnersByOperatorId,
  getAllRegistrations,
  getAllRegistrationRNs
};
