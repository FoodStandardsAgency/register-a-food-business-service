// Add error code information
// Standard error code list
// 200 - OK
// 400 - Bad Request (Client Error) - A json with error \ more details should return to the client.
// 401 - Unauthorized
// 500 - Internal Server Error - A json with an error should return to the client only when there is no security risk by doing that.
// Codes: DB error, notify error
// 3 - validation error
// 4 - sequelizeConnectionError
// 95 - notifyMissingKey
// 96 - notifyInvalidTemplate
// 97 - notifyMissingPersonalisation
// 8 - mongoConnectionError

const { logEmitter } = require("../services/logging.service");
const errorDetails = require("./errors.json");

/* eslint-disable */
const errorHandler = (err, req, res, next) => {
  /* eslint-enable */
  logEmitter.emit("error", `Application error handled - ${err && err.message}`); // Used for Azure alerts

  if (err.name) {
    const errorDetail = errorDetails.find((error) => {
      return error.name === err.name;
    });
    if (errorDetail) {
      if (errorDetail.name === "validationError") {
        errorDetail.userMessages = err.validationErrors;
      }

      if (
        errorDetail.name === "notifyInvalidTemplate" ||
        errorDetail.name === "notifyMissingPersonalisation"
      ) {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "fsaRnFetchError") {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "mongoConnectionError") {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "localCouncilNotFound") {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "supplierCouncilNotFound") {
        errorDetail.developerMessage = `${errorDetail.developerMessage}`;
      }

      if (errorDetail.name === "doubleFail") {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "missingRequiredHeader") {
        errorDetail.developerMessage = `${errorDetail.developerMessage} ${err.message}`;
      }

      if (errorDetail.name === "optionsValidationError") {
        errorDetail.rawError = err.rawError;
      }

      if (res) {
        res.status(errorDetail.statusCode);
        res.send({
          errorCode: errorDetail.code,
          developerMessage: errorDetail.developerMessage,
          userMessages: errorDetail.userMessages,
          statusCode: errorDetail.statusCode,
          rawError: errorDetail.rawError || undefined
        });
      }
    } else {
      if (res) {
        res.status(500);
        res.send({
          errorCode: "Unknown",
          developerMessage: "Unknown error found, debug and add to error cases",
          userMessages: ""
        });
      }
    }
  } else {
    if (res) {
      res.status(500);
      res.send({
        errorCode: "Unknown",
        developerMessage: "Unknown error found, debug and add to error cases",
        userMessages: ""
      });
    }
  }
};

module.exports = { errorHandler };
