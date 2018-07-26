const {
  createRegistration,
  createEstablishment
} = require("../../connectors/registrationDb/registrationDb");

const saveRegistration = async registration => {
  const regId = await createRegistration({}).id;
  const establishmentId = await createEstablishment(
    registration.establishment.establishment_details,
    regId
  ).id;
  return { regId, establishmentId };
};

module.exports = { saveRegistration };
