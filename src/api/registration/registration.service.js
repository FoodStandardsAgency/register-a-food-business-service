const {
  createRegistration
} = require("../../connectors/registrationDb/registrationDb");

const saveRegistration = async () => {
  const registrationId = await createRegistration({});
  return registrationId;
};

module.exports = { saveRegistration };
