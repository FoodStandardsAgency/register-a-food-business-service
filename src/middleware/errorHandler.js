// Add error code information
// Standard error code list
// 200 - OK
// 400 - Bad Request (Client Error) - A json with error \ more details should return to the client.
// 401 - Unauthorized
// 500 - Internal Server Error - A json with an error should return to the client only when there is no security risk by doing that.
// Codes: DB error, notify error, tascomi error
// 1 - TascomiAuth failure
// 2 - TascomiRefNumber failure
// 3 - validation error
// 4 - sequelizeConnectionError
// 5 - notifyMissingKey
// 6 - notifyInvalidTemplate
// 7 - notifyMissingPersonalisation

const errorDetails = [
  {
    name: "tascomiAuth",
    code: "1",
    developerMessage:
      "Authentication with Tascomi API failed, have you supplied the application with the correct keys?",
    userMessages: "",
    statusCode: 500
  },
  {
    name: "tascomiRefNumber",
    code: "2",
    developerMessage: "Tascomi ref number creation failed",
    userMessages: "",
    statusCode: 500
  },
  {
    name: "validationError",
    code: "3",
    developerMessage:
      "Validation error, check request body vs validation schema",
    userMessages: "",
    statusCode: 400
  },
  {
    name: "SequelizeConnectionError",
    code: "4",
    developerMessage:
      "Could not make connection to Sequelize, check authentication rules on database and credentials provided to app",
    userMessages: "",
    statusCode: 500
  },
  {
    name: "notifyMissingKey",
    code: "5",
    developerMessage:
      "Key for notify service missing, check credentials provided to app",
    userMessages: "",
    statusCode: 500
  },
  {
    name: "notifyInvalidTemplate",
    code: "6",
    developerMessage:
      "Notify template ID is not valid, check credentials provided to app. Raw error: ",
    userMessages: "",
    statusCode: 500
  },
  {
    name: "notifyMissingPersonalisation",
    code: "7",
    developerMessage:
      "Notify personalisation is missing, check data sent to Notify API. Raw error: ",
    userMessages: "",
    statusCode: 500
  }
];

const errorHandler = (err, req, res, next) => {
  const errorDetail = errorDetails.find(error => {
    return error.name === err.name;
  });
  if (errorDetail.name === "validationError") {
    errorDetail.userMessages = err.validationErrors;
  }

  if (
    errorDetail.name === "notifyInvalidTemplate" ||
    errorDetail.name === "notifyMissingPersonalisation"
  ) {
    errorDetail.developerMessage = `${errorDetail.developerMessage} ${
      err.message
    }`;
  }

  if (err.statusCode === undefined) {
    err.statusCode = 500;
  }
  res.status(errorDetail.statusCode).send({
    errorCode: errorDetail.code,
    developerMessage: errorDetail.developerMessage,
    userMessages: errorDetail.userMessages
  });
};

module.exports = { errorHandler };
