const {
  createRegistration,
  createEstablishment
} = require("../../connectors/registrationDb/registrationDb");

const saveRegistration = async registration => {
  const reg = await createRegistration({});
  const establishment = await createEstablishment(
    registration.establishment.establishment_details,
    reg.id
  );
  return { regId: reg.id, establishmentId: establishment.id };
};

module.exports = { saveRegistration };
