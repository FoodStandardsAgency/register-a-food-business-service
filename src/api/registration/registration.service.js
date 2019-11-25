const moment = require("moment");
const fetch = require("node-fetch");
const promiseRetry = require("promise-retry");

const {
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
  addDeletedId
} = require("../../connectors/configDb/configDb.connector");

const {
  updateStatusInCache
} = require("../../connectors/cacheDb/cacheDb.connector");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

const saveRegistration = async (registration, fsa_rn, council) => {
  logEmitter.emit("functionCall", "registration.service", "saveRegistration");

  try {
    const reg = await createRegistration(fsa_rn, council);
    const establishment = await createEstablishment(
      registration.establishment.establishment_details,
      reg.id
    );
    const operator = await createOperator(
      registration.establishment.operator,
      establishment.id
    );
    const activities = await createActivities(
      registration.establishment.activities,
      establishment.id
    );
    const premise = await createPremise(
      registration.establishment.premise,
      establishment.id
    );
    const partnerIds = [];
    for (const partnerIndex in registration.establishment.operator.partners) {
      const partner = await createPartner(
        registration.establishment.operator.partners[partnerIndex],
        operator.id
      );
      partnerIds.push(partner.id);
    }

    const declaration = await createDeclaration(
      registration.declaration,
      reg.id
    );
    await updateStatusInCache(fsa_rn, "registration", true);
    statusEmitter.emit("incrementCount", "storeRegistrationsInDbSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentStoreRegistrationInDbSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "saveRegistration"
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
  } catch (err) {
    await updateStatusInCache(fsa_rn, "registration", false);
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

const sendTascomiRegistration = async (
  registration,
  postRegistrationMetadata,
  localCouncil
) => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "sendTascomiRegistration"
  );
  try {
    const auth = await getLcAuth(localCouncil);
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

    const response = await promiseRetry({ retries: 3 }, (retry, number) => {
      logEmitter.emit(
        "functionCall",
        "registration.service",
        `createdReferenceNumber attempt ${number}`
      );
      return createReferenceNumber(JSON.parse(reg).id, auth).catch(retry);
    });

    if (JSON.parse(response).id === 0) {
      const err = new Error("createReferenceNumber failed");
      err.name = "tascomiRefNumber";
      throw err;
    }
    updateStatusInCache(postRegistrationMetadata["fsa-rn"], "tascomi", true);

    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "sendTascomiRegistration"
    );
    return response;
  } catch (err) {
    updateStatusInCache(postRegistrationMetadata["fsa_rn"], "tascomi", false);
    logEmitter.emit(
      "functionFail",
      "registrationService",
      "sendTascomiRegistration",
      err
    );
    throw err;
  }
};

const getRegistrationMetaData = async councilCode => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "getRegistrationDeclaration"
  );

  const typeCode = process.env.NODE_ENV === "production" ? "001" : "000";
  const reg_submission_date = moment().format("YYYY-MM-DD");
  let fsa_rn;

  try {
    const fsaRnResponse = await fetch(
      `https://fsa-reference-numbers.epimorphics.net/generate/${councilCode}/${typeCode}`
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
              local_council_email: urlLcConfig.local_council_email
            },
            standards: {
              code: standardsLcConfig._id,
              local_council: standardsLcConfig.local_council,
              local_council_notify_emails:
                standardsLcConfig.local_council_notify_emails,
              local_council_email: standardsLcConfig.local_council_email
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
            local_council_email: urlLcConfig.local_council_email
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
  getLcAuth
};
