const { info, error } = require("winston");
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

const saveRegistration = async registration => {
  info("registration.connector: saveRegistration: called");
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
  info("registration.connector: saveRegistration: successful");
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
  info("registration.connector: getFullRegistrationById: called");
  const registration = await getRegistrationById(id);
  const establishment = await getEstablishmentByRegId(registration.id);
  const metadata = await getMetadataByRegId(registration.id);
  const operator = await getOperatorByEstablishmentId(establishment.id);
  const activities = await getActivitiesByEstablishmentId(establishment.id);
  const premise = await getPremiseByEstablishmentId(establishment.id);
  info("registration.connector: getFullRegistrationById: successful");
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
  info("registration.connector: sendTascomiRegistration: called");
  const reg = await createFoodBusinessRegistration(registration, fsa_rn);
  const response = await createReferenceNumber(JSON.parse(reg).id);
  info("registration.connector: sendTascomiRegistration: successful");
  return response;
};

const getRegistrationMetaData = async () => {
  const reg_submission_date = moment().format("YYYY MM DD");
  const fsaRnResponse = await fetch(
    "https://fsa-rn.epimorphics.net/fsa-rn/1000/01"
  );
  let fsa_rn;
  if (fsaRnResponse.status === 200) {
    fsa_rn = await fsaRnResponse.json();
  }

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
  info("registration.service: sendFboEmail called");
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
    error(`registration.service: sendFboEmail errored: ${err}`);
  }
  info("registration.service: sendFboEmail finished");
  return fboEmailSent;
};

const sendLcEmail = async (
  registration,
  postRegistrationMetadata,
  localCouncilContactDetails
) => {
  info("registration.service: sendLcEmail called");
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
    error(`registration.service: sendLcEmail errored: ${err}`);
  }
  info("registration.service: sendLcEmail finished");
  return lcEmailSent;
};

module.exports = {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail,
  sendLcEmail
};
