const { validate } = require("../../services/validation.service");
const {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail,
  sendLcEmail
} = require("./registration.service");

const { info } = require("winston");

const createNewRegistration = async registration => {
  info("registration.controller: createNewRegistration called");
  // AUTHENTICATION

  // VALIDATION
  if (registration === undefined) {
    throw new Error("registration is undefined");
  }
  const errors = validate(registration);
  if (errors.length) {
    throw new Error(JSON.stringify(errors));
  }

  // RESOLUTION
  // This is a stubbed email until LC lookup is implemented
  const localCouncilEmail = "fsatestemail.valid@gmail.com)";
  const metaDataResponse = await getRegistrationMetaData();
  const tascomiResponse = await sendTascomiRegistration(
    registration,
    metaDataResponse["fsa-rn"]
  );
  const tascomiObject = JSON.parse(tascomiResponse);
  const response = await saveRegistration(registration);

  const emailSuccessOrFailureFbo = await sendFboEmail(
    registration,
    metaDataResponse
  );

  const emailSuccessOrFailureLc = await sendLcEmail(
    registration,
    metaDataResponse,
    localCouncilEmail
  );

  const combinedResponse = Object.assign(
    response,
    metaDataResponse,
    {
      tascomiResponse: tascomiObject
    },
    emailSuccessOrFailureFbo,
    emailSuccessOrFailureLc
  );

  info("registration.controller: createNewRegistration finished");
  return combinedResponse;
};

const getRegistration = async id => {
  // AUTHENTICATION

  // RESOLUTION
  const response = await getFullRegistrationById(id);

  return response;
};

module.exports = { createNewRegistration, getRegistration };
