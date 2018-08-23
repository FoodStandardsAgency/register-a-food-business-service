const moment = require("moment");
const fetch = require("node-fetch");

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
  getRegistrationById,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId
} = require("../../connectors/registrationDb/registrationDb");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const { sendSingleEmail } = require("../../connectors/notify/notify.connector");

const {
  getAllLocalCouncilConfig
} = require("../../connectors/configDb/configDb.connector");

const { logEmitter } = require("../../services/logging.service");

const saveRegistration = async registration => {
  logEmitter.emit("functionCall", "registration.service", "saveRegistration");
  const reg = await createRegistration({});
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
};

const getFullRegistrationById = async id => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "getFullRegistrationById"
  );
  const registration = await getRegistrationById(id);
  const establishment = await getEstablishmentByRegId(registration.id);
  const metadata = await getMetadataByRegId(registration.id);
  const operator = await getOperatorByEstablishmentId(establishment.id);
  const activities = await getActivitiesByEstablishmentId(establishment.id);
  const premise = await getPremiseByEstablishmentId(establishment.id);
  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "getFullRegistrationById"
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

const sendTascomiRegistration = async (registration, fsa_rn) => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "sendTascomiRegistration"
  );
  try {
    const reg = await createFoodBusinessRegistration(registration, fsa_rn);
    const response = await createReferenceNumber(JSON.parse(reg).id);
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

const getRegistrationMetaData = async () => {
  logEmitter.emit(
    "functionCall",
    "registration.service",
    "getRegistrationMetadata"
  );
  const reg_submission_date = moment().format("YYYY MM DD");
  const fsaRnResponse = await fetch(
    "https://fsa-rn.epimorphics.net/fsa-rn/1000/01"
  );
  let fsa_rn;
  if (fsaRnResponse.status === 200) {
    fsa_rn = await fsaRnResponse.json();
  }
  logEmitter.emit(
    "functionSuccess",
    "registration.service",
    "getRegistrationMetadata"
  );
  return {
    "fsa-rn": fsa_rn ? fsa_rn["fsa-rn"] : undefined,
    reg_submission_date: reg_submission_date
  };
};

const sendFboEmail = async (
  registration,
  postRegistrationMetadata,
  localCouncilContactDetails
) => {
  logEmitter.emit("functionCall", "registration.service", "sendFboEmail");
  const fboEmailSent = { email_fbo: { success: undefined } };
  const fboEmailAddress =
    registration.establishment.operator.operator_email ||
    registration.establishment.operator.contact_representative_email;

  try {
    await sendSingleEmail(
      NOTIFY_TEMPLATE_ID_FBO,
      fboEmailAddress,
      registration,
      postRegistrationMetadata,
      localCouncilContactDetails
    );
    fboEmailSent.email_fbo = { success: true, recipient: fboEmailAddress };
  } catch (err) {
    fboEmailSent.email_fbo = { success: false, recipient: fboEmailAddress };
    logEmitter.emit(
      "functionFail",
      "registration.service",
      "sendFboEmail",
      err
    );
    throw err;
  }
  logEmitter.emit("functionSuccess", "registration.service", "sendFboEmail");
  return fboEmailSent;
};

const sendLcEmail = async (
  registration,
  postRegistrationMetadata,
  localCouncilContactDetails
) => {
  logEmitter.emit("functionCall", "registration.service", "sendLcEmail");
  const lcEmailSent = { email_lc: { success: undefined } };
  const lcEmailAddress = localCouncilContactDetails.local_council_email;

  try {
    await sendSingleEmail(
      NOTIFY_TEMPLATE_ID_LC,
      lcEmailAddress,
      registration,
      postRegistrationMetadata,
      localCouncilContactDetails
    );
    lcEmailSent.email_lc = { success: true, recipient: lcEmailAddress };
  } catch (err) {
    lcEmailSent.email_lc = { success: false, recipient: lcEmailAddress };
    logEmitter.emit("functionFail", "registration.service", "sendLcEmail", err);
  }
  logEmitter.emit("functionSuccess", "registration.service", "sendLcEmail");
  return lcEmailSent;
};

const getLcEmailConfig = async localCouncilUrl => {
  logEmitter.emit("functionCall", "registration.service", "getLcEmailConfig");

  if (localCouncilUrl) {
    const allLcConfigData = await getAllLocalCouncilConfig();

    const urlLcConfig = allLcConfigData.find(
      localCouncil => localCouncil.urlString === localCouncilUrl
    );

    if (urlLcConfig) {
      if (urlLcConfig.separateStandardsCouncil) {
        const standardsLcConfig = allLcConfigData.find(
          localCouncil =>
            localCouncil._id === urlLcConfig.separateStandardsCouncil
        );

        if (standardsLcConfig) {
          const separateCouncils = {
            hygiene: {
              code: urlLcConfig._id,
              lcName: urlLcConfig.lcName,
              lcNotificationEmails: urlLcConfig.lcNotificationEmails,
              lcContactEmail: urlLcConfig.lcContactEmail
            },
            standards: {
              code: standardsLcConfig._id,
              lcName: standardsLcConfig.lcName,
              lcNotificationEmails: standardsLcConfig.lcNotificationEmails,
              lcContactEmail: standardsLcConfig.lcContactEmail
            }
          };

          logEmitter.emit(
            "functionSuccess",
            "registration.service",
            "getLcEmailConfig"
          );

          return separateCouncils;
        } else {
          const newError = new Error();
          newError.name = "localCouncilNotFound";
          newError.message = `A separate standards council config with the code "${
            urlLcConfig.separateStandardsCouncil
          }" was expected for "${localCouncilUrl}" but does not exist`;
          logEmitter.emit(
            "functionFail",
            "registration.service",
            "getLcEmailConfig",
            newError
          );
          throw newError;
        }
      } else {
        const hygieneAndStandardsCouncil = {
          hygieneAndStandards: {
            code: urlLcConfig._id,
            lcName: urlLcConfig.lcName,
            lcNotificationEmails: urlLcConfig.lcNotificationEmails,
            lcContactEmail: urlLcConfig.lcContactEmail
          }
        };

        logEmitter.emit(
          "functionSuccess",
          "registration.service",
          "getLcEmailConfig"
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
        "getLcEmailConfig",
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
      "getLcEmailConfig",
      newError
    );
    throw newError;
  }
};

module.exports = {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail,
  sendLcEmail,
  getLcEmailConfig
};
