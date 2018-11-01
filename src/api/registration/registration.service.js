const moment = require("moment");
const fetch = require("node-fetch");
const fs = require("fs");
const {
  pdfGenerator,
  transformDataForPdf
} = require("../../services/pdf.service");

const {
  NOTIFY_TEMPLATE_ID_FBO,
  NOTIFY_TEMPLATE_ID_LC
} = require("../../config");

const {
  createRegistration,
  createEstablishment,
  createOperator,
  createActivities,
  createPremise,
  createMetadata,
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
} = require("../../connectors/registrationDb/registrationDb");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const { sendSingleEmail } = require("../../connectors/notify/notify.connector");

const {
  getAllLocalCouncilConfig,
  addDeletedId
} = require("../../connectors/configDb/configDb.connector");

const {
  transformDataForNotify
} = require("../../services/notifications.service");

const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

const saveRegistration = async (registration, fsa_rn) => {
  logEmitter.emit("functionCall", "registration.service", "saveRegistration");

  try {
    const reg = await createRegistration(fsa_rn);
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
    const metadata = await createMetadata(registration.metadata, reg.id);

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
      metadataId: metadata.id
    };
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
  const metadata = await getMetadataByRegId(registration.id);
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
    metadata
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
  await destroyMetadataByRegId(registration.id);
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
    const reg = await createFoodBusinessRegistration(
      registration,
      postRegistrationMetadata,
      auth
    );
    const response = await createReferenceNumber(JSON.parse(reg).id, auth);
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
  } catch (err) {
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
    "getRegistrationMetadata"
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
      "getRegistrationMetadata"
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

const sendEmailOfType = async (
  typeOfEmail,
  registration,
  postRegistrationMetadata,
  lcContactConfig,
  recipientEmailAddress
) => {
  logEmitter.emit("functionCall", "registration.service", "sendEmailOfType");

  const emailSent = { success: undefined, recipient: recipientEmailAddress };

  let templateId;

  if (typeOfEmail === "LC") {
    templateId = NOTIFY_TEMPLATE_ID_LC;
  }
  if (typeOfEmail === "FBO") {
    templateId = NOTIFY_TEMPLATE_ID_FBO;
  }

  try {
    const data = transformDataForNotify(
      registration,
      postRegistrationMetadata,
      lcContactConfig
    );

    const dataForPDF = transformDataForPdf(
      registration,
      postRegistrationMetadata,
      lcContactConfig
    );

    let pdfFile = undefined;
    if (typeOfEmail === "LC") {
      pdfFile = await pdfGenerator(dataForPDF);
    }

    fs.writeFile("out.pdf", pdfFile, 'base64');

    // await sendSingleEmail(templateId, recipientEmailAddress, data, pdfFile);
    emailSent.success = true;

    statusEmitter.emit("incrementCount", "emailNotificationsSucceeded");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      true
    );
    logEmitter.emit(
      "functionSuccess",
      "registration.service",
      "sendEmailOfType"
    );
  } catch (err) {
    emailSent.success = false;
    statusEmitter.emit("incrementCount", "emailNotificationsFailed");
    statusEmitter.emit(
      "setStatus",
      "mostRecentEmailNotificationSucceeded",
      false
    );
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "sendEmailOfType",
      err
    );
  }
  return emailSent;
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
  sendEmailOfType,
  getLcContactConfig,
  getLcAuth
};
