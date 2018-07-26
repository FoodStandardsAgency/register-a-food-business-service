const { info } = require("winston");
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

const saveRegistration = async registration => {
  info("Function: saveRegistration called");
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
  info("Function: saveRegistration successful");
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
  const registration = await getRegistrationById(id);
  const establishment = await getEstablishmentByRegId(registration.id);
  const metadata = await getMetadataByRegId(registration.id);
  const operator = await getOperatorByEstablishmentId(establishment.id);
  const activities = await getActivitiesByEstablishmentId(establishment.id);
  const premise = await getPremiseByEstablishmentId(establishment.id);
  return {
    registration,
    establishment,
    operator,
    activities,
    premise,
    metadata
  };
};

module.exports = { saveRegistration, getFullRegistrationById };
