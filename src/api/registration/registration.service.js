const moment = require("moment");
const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const promiseRetry = require("promise-retry");
const { isEmpty } = require("lodash");
const { INFO } = require("../../services/logging.service");
const {
  // managedTransaction,
  createRegistration,
  createEstablishment,
  createOperator,
  createActivities,
  createPremise,
  createPartner,
  createDeclaration,
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
  destroyActivitiesByEstablishmentId
} = require("../../connectors/registrationDb/registrationDb");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const {
  getAllLocalCouncilConfig,
  addDeletedId,
  mongodb
} = require("../../connectors/configDb/configDb.connector");

const {
  updateStatusInCache
} = require("../../connectors/cacheDb/cacheDb.connector");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

const saveRegistration = async (registration, fsa_rn, council) => {
  logEmitter.emit("functionCall", "registration.service", "saveRegistration");

  const transaction = async transaction => {
    let reg;
    let operator;
    let activities;
    let premise;
    let establishment;

    let pgReg = await getRegistrationByFsaRn(fsa_rn, transaction);
    if (!isEmpty(pgReg)) {
      throw new Error(
        `Registration with fsa id '${fsa_rn}' already exists in temp-store`
      );
    }

    reg = await createRegistration(fsa_rn, council);

    establishment = await createEstablishment(
      registration.establishment.establishment_details,
      reg.id,
      transaction
    );

    operator = await createOperator(
      registration.establishment.operator,
      establishment.id,
      transaction
    );

    activities = await createActivities(
      registration.establishment.activities,
      establishment.id,
      transaction
    );

    premise = await createPremise(
      registration.establishment.premise,
      establishment.id,
      transaction
    );
    let partnerIds = [];
    let partner;
    let partnerIndex;

    for (partnerIndex in registration.establishment.operator.partners) {
      partner = await createPartner(
        registration.establishment.operator.partners[partnerIndex],
        operator.id,
        transaction
      );
      partnerIds.push(partner.id);
    }

    const declaration = await createDeclaration(
      registration.declaration,
      reg.id,
      transaction
    );

    statusEmitter.emit("incrementCount", "storeRegistrationsInDbSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentStoreRegistrationInDbSucceeded",
      true
    );

    return {
      regId: reg.id,
      establishmentId: establishment.id,
      operatorId: operator.id,
      activitiesId: activities.id,
      premiseId: premise.id,
      partnerIds,
      declarationId: declaration.id
    };
  };

  try {
    //execute the transaction
    let tempStoreSaved = await transaction();

    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "saveRegistration"
    );
    logEmitter.emit(
      INFO,
      `Saved ${tempStoreSaved.id} fsaId: ${fsa_rn} in temp store `
    );

    await updateStatusInCache(fsa_rn, "registration", true);

    return tempStoreSaved;
  } catch (err) {
    statusEmitter.emit("incrementCount", "storeRegistrationsInDbFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentStoreRegistrationInDbSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "saveRegistration",
      err
    );
    await updateStatusInCache(fsa_rn, "registration", false);
    throw err;
  }
};

const getFullRegistrationByFsaRn = async fsa_rn => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "getFullRegistrationByFsaRn"
  );
  const registration = await getRegistrationByFsaRn(fsa_rn);
  if (!registration) {
    return `No registration found for fsa_rn: ${fsa_rn}`;
  }
  const establishment = await getEstablishmentByRegId(registration.id);
  const declaration = await getDeclarationByRegId(registration.id);
  const operator = await getOperatorByEstablishmentId(establishment.id);
  const activities = await getActivitiesByEstablishmentId(establishment.id);
  const premise = await getPremiseByEstablishmentId(establishment.id);
  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "getFullRegistrationByFsaRn"
  );
  return {
    registration,
    establishment,
    operator,
    activities,
    premise,
    declaration
  };
};

const deleteRegistrationByFsaRn = async fsa_rn => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "deleteFullRegistrationByFsaRn"
  );
  const registration = await getRegistrationByFsaRn(fsa_rn);
  if (!registration) {
    return `No registration found for fsa_rn: ${fsa_rn}`;
  }
  const establishment = await getEstablishmentByRegId(registration.id);
  await destroyDeclarationByRegId(registration.id);
  await destroyOperatorByEstablishmentId(establishment.id);
  await destroyActivitiesByEstablishmentId(establishment.id);
  await destroyPremiseByEstablishmentId(establishment.id);
  await destroyEstablishmentByRegId(registration.id);
  await destroyRegistrationById(registration.id);
  await addDeletedId(fsa_rn);
  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "deleteFullRegistrationByFsaRn"
  );
  return "Registration succesfully deleted";
};

const sendTascomiRegistration = async (registration, localCouncil) => {
  // hack to reduce repair work needed
  let postRegistrationMetadata = registration;

  logEmitter.emit(
    "functionCall",
    "registration.service",
    "sendTascomiRegistration"
  );

  if (!localCouncil.auth) {
    //no auth so cannot return a value
    return null;
  }

  const auth = localCouncil.auth;
  const reg = await promiseRetry({ retries: 3 }, (retry, number) => {
    logEmitter.emit(
      "functionCall",
      "registration.service",
      `createdFoodBusinessRegistration attempt ${number}`
    );
    return createFoodBusinessRegistration(
      registration,
      postRegistrationMetadata,
      auth
    ).catch(retry);
  });

  let regParsed = JSON.parse(reg);
  let referenceIdInput = regParsed.id ? regParsed.id : null;

  if (referenceIdInput === null) {
    const err = new Error("createFoodBusinessRegistration failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  const response = await promiseRetry({ retries: 3 }, (retry, number) => {
    logEmitter.emit(
      "functionCall",
      "registration.service",
      `createdReferenceNumber attempt ${number}`
    );
    return createReferenceNumber(referenceIdInput, auth).catch(retry);
  });

  if (JSON.parse(response).id === 0) {
    const err = new Error("createReferenceNumber failed");
    err.name = "tascomiRefNumber";
    throw err;
  }

  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "sendTascomiRegistration"
  );

  return response;
};

const getRegistrationMetaData = async councilCode => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "getRegistrationDeclaration"
  );

  if (process.env.NODE_ENV === "local") {
    let oId = mongodb.ObjectId();

    return {
      "fsa-rn": oId.toString(),
      reg_submission_date: moment().format("YYYY-MM-DD")
    };
  }

  const typeCode = process.env.NODE_ENV === "production" ? "001" : "000";
  const reg_submission_date = moment().format("YYYY-MM-DD");
  let fsa_rn;

  try {
    const options = {};
    if (process.env.HTTP_PROXY) {
      options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    }
    const fsaRnResponse = await fetch(
      `https://fsa-reference-numbers.epimorphics.net/generate/${councilCode}/${typeCode}`,
      options
    );
    if (fsaRnResponse.status === 200) {
      fsa_rn = await fsaRnResponse.json();
    }

    statusEmitter.emit("incrementCount", "fsaRnCallsSucceeded");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", true);
    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "getRegistrationDeclaration"
    );
    return {
      "fsa-rn": fsa_rn ? fsa_rn["fsa-rn"] : undefined,
      reg_submission_date: reg_submission_date
    };
  } catch (err) {
    statusEmitter.emit("incrementCount", "fsaRnCallsFailed");
    statusEmitter.emit("setStatus", "mostRecentFsaRnCallSucceeded", false);
    logEmitter.emit(
      "functionFail",
      "registrationService",
      "getRegistrationMetaData",
      err
    );

    const newError = new Error();
    newError.name = "fsaRnFetchError";
    newError.message = err.message;

    throw newError;
  }
};

const getLcContactConfigFromArray = async (
  localCouncilUrl,
  allCouncils = []
) => {
  logEmitter.emit("functionCall", "registration.service", "getLcContactConfig");

  if (localCouncilUrl) {
    const allLcConfigData = allCouncils;

    const urlLcConfig = allLcConfigData.find(
      localCouncil => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      if (urlLcConfig.separate_standards_council) {
        const standardsLcConfig = allLcConfigData.find(
          localCouncil =>
            localCouncil._id === urlLcConfig.separate_standards_council
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: {
              code: urlLcConfig._id,
              local_council: urlLcConfig.local_council,
              local_council_notify_emails:
                urlLcConfig.local_council_notify_emails,
              local_council_email: urlLcConfig.local_council_email,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }
          if (standardsLcConfig.local_council_phone_number) {
            separateCouncils.standards.local_council_phone_number =
              standardsLcConfig.local_council_phone_number;
          }

          logEmitter.emit(
            "functionSuccess",
            "registration.service",
            "getLcContactConfig"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${
            urlLcConfig.separate_standards_council
          }" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "registration.service",
            "getLcContactConfig",
            newError
          );
          throw newError;
        }
      } else {
        const hygieneAndStandardsCouncil = {
          hygieneAndStandards: {
            code: urlLcConfig._id,
            local_council: urlLcConfig.local_council,
            local_council_notify_emails:
              urlLcConfig.local_council_notify_emails,
            local_council_email: urlLcConfig.local_council_email,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.local_council_phone_number) {
          hygieneAndStandardsCouncil.hygieneAndStandards.local_council_phone_number =
            urlLcConfig.local_council_phone_number;
        }

        logEmitter.emit(
          "functionSuccess",
          "registration.service",
          "getLcContactConfig"
        );

        return hygieneAndStandardsCouncil;
      }
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "registration.service",
        "getLcContactConfig",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "getLcContactConfig",
      newError
    );
    throw newError;
  }
};

const getLcContactConfig = async localCouncilUrl => {
  logEmitter.emit("functionCall", "registration.service", "getLcContactConfig");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      localCouncil => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      if (urlLcConfig.separate_standards_council) {
        const standardsLcConfig = allLcConfigData.find(
          localCouncil =>
            localCouncil._id === urlLcConfig.separate_standards_council
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: {
              code: urlLcConfig._id,
              local_council: urlLcConfig.local_council,
              local_council_notify_emails:
                urlLcConfig.local_council_notify_emails,
              local_council_email: urlLcConfig.local_council_email,
              country: urlLcConfig.country,
              hasAuth: urlLcConfig.auth ? true : false
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email,
              hasAuth: standardsLcConfig.auth ? true : false
            }
          };

          if (urlLcConfig.local_council_phone_number) {
            separateCouncils.hygiene.local_council_phone_number =
              urlLcConfig.local_council_phone_number;
          }
          if (standardsLcConfig.local_council_phone_number) {
            separateCouncils.standards.local_council_phone_number =
              standardsLcConfig.local_council_phone_number;
          }

          logEmitter.emit(
            "functionSuccess",
            "registration.service",
            "getLcContactConfig"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${
            urlLcConfig.separate_standards_council
          }" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "registration.service",
            "getLcContactConfig",
            newError
          );
          throw newError;
        }
      } else {
        const hygieneAndStandardsCouncil = {
          hygieneAndStandards: {
            code: urlLcConfig._id,
            local_council: urlLcConfig.local_council,
            local_council_notify_emails:
              urlLcConfig.local_council_notify_emails,
            local_council_email: urlLcConfig.local_council_email,
            country: urlLcConfig.country,
            hasAuth: urlLcConfig.auth ? true : false
          }
        };

        if (urlLcConfig.local_council_phone_number) {
          hygieneAndStandardsCouncil.hygieneAndStandards.local_council_phone_number =
            urlLcConfig.local_council_phone_number;
        }

        logEmitter.emit(
          "functionSuccess",
          "registration.service",
          "getLcContactConfig"
        );

        return hygieneAndStandardsCouncil;
      }
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "registration.service",
        "getLcContactConfig",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "getLcContactConfig",
      newError
    );
    throw newError;
  }
};

const getLcAuth = async localCouncilUrl => {
  logEmitter.emit("functionCall", "registration.service", "getLcAuth");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      localCouncil => localCouncil.local_council_url === localCouncilUrl
    );

    if (urlLcConfig) {
      logEmitter.emit("functionSuccess", "registration.service", "getLcAuth");
      return urlLcConfig.auth;
    } else {
      const newError = new Error();
      newError.name = "localCouncilNotFound";
      newError.message = `Config for "${localCouncilUrl}" not found`;
      logEmitter.emit(
        "functionFail",
        "registration.service",
        "getLcAuth",
        newError
      );
      throw newError;
    }
  } else {
    const newError = new Error();
    newError.name = "localCouncilNotFound";
    newError.message = "Local council URL is undefined";
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "getLcAuth",
      newError
    );
    throw newError;
  }
};

module.exports = {
  saveRegistration,
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  sendTascomiRegistration,
  getRegistrationMetaData,
  getLcContactConfig,
  getLcContactConfigFromArray,
  getLcAuth
};
