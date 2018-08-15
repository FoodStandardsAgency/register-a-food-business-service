const moment = require("moment");
const fetch = require("node-fetch");

const { NOTIFY_TEMPLATE_ID_FBO } = require("../../config");

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

const sendFboEmail = async (registration, postRegistrationMetadata) => {
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
      postRegistrationMetadata
    );
    fboEmailSent.email_fbo = { success: true, recipient: fboEmailAddress };
  } catch (err) {
    fboEmailSent.email_fbo = { success: false, recipient: fboEmailAddress };
    logEmitter.emit("functionFail", "registration.service", "sendFboEmail");
    throw err;
  }
  logEmitter.emit("functionSuccess", "registration.service", "sendFboEmail");
  return fboEmailSent;
};

module.exports = {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail
};
