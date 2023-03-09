const { Router } = require("express");
const submissionsController = require("./submissions.controller");
const { createRegistrationAuth } = require("../../middleware/authHandler");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const { registrationDouble } = require("./submissions.double");

const submissionsRouter = () => {
  const router = Router();

  router.post(
    "/createNewRegistration",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit(
        "functionCall",
        "submissions.router",
        "createNewRegistration"
      );
      try {
        statusEmitter.emit("incrementCount", "submissionsReceived");

        const regDataVersion = req.headers["registration-data-version"];

        if (regDataVersion === undefined) {
          const missingHeaderError = new Error(
            "Missing 'registration-data-version' header"
          );
          missingHeaderError.name = "missingRequiredHeader";
          throw missingHeaderError;
        }

        const response = await submissionsController.createNewRegistration(
          req.body.registration,
          req.body.local_council_url,
          req.body.submission_language,
          req.body.manual_local_authority,
          regDataVersion
        );
        statusEmitter.emit("incrementCount", "userRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentUserRegistrationSucceeded",
          true
        );
        statusEmitter.emit("incrementCount", "endToEndRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentEndToEndRegistrationSucceeded",
          true
        );
        logEmitter.emit(
          "functionSuccess",
          "submissions.router",
          "createNewRegistration"
        );

        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "submissions.router",
          "createNewRegistration",
          req.body.registration
        );
        statusEmitter.emit("incrementCount", "endToEndRegistrationsFailed");
        statusEmitter.emit(
          "setStatus",
          "mostRecentEndToEndRegistrationSucceeded",
          false
        );
        logEmitter.emit(
          "functionFail",
          "submissions.router",
          "createNewRegistration",
          err
        );
        next(err);
      }
    }
  );

  router.post(
    "/v2/createNewDirectRegistration/:subscriber",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit(
        "functionCall",
        "submissions.router",
        "createNewDirectRegistration"
      );
      try {
        statusEmitter.emit("incrementCount", "directSubmissionsReceived");

        const options = {
          apiVersion: req.headers["api-version"] || "v2.1",
          subscriber: req.params.subscriber || "",
          requestedCouncil:
            req.query["local-authority"] || req.params.subscriber
        };

        let response;
        if (req.headers["double-mode"]) {
          response = registrationDouble(req.headers["double-mode"]);
        } else {
          response = await submissionsController.createNewDirectRegistration(
            req.body,
            options
          );
        }
        statusEmitter.emit("incrementCount", "directRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentDirectRegistrationSucceeded",
          true
        );
        logEmitter.emit(
          "functionSuccess",
          "submissions.router",
          "createNewDirectRegistration"
        );
        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "submissions.router",
          "createNewDirectRegistration",
          req.body
        );
        statusEmitter.emit("incrementCount", "directRegistrationsFailed");
        statusEmitter.emit(
          "setStatus",
          "mostRecentDirectRegistrationSucceeded",
          false
        );
        logEmitter.emit(
          "functionFail",
          "submissions.router",
          "createNewDirectRegistration",
          err
        );
        next(err);
      }
    }
  );

  router.post(
    "/v3/createNewDirectRegistration/:subscriber",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit(
        "functionCall",
        "submissions.router",
        "createNewDirectRegistration-v3"
      );
      try {
        statusEmitter.emit("incrementCount", "directSubmissionsReceived");

        const options = {
          apiVersion: req.headers["api-version"] || "v3.0",
          subscriber: req.params.subscriber || "",
          requestedCouncil:
            req.query["local-authority"] || req.params.subscriber
        };

        let response;
        if (req.headers["double-mode"]) {
          response = registrationDouble(req.headers["double-mode"]);
        } else {
          response = await submissionsController.createNewDirectRegistration(
            req.body,
            options
          );
        }
        statusEmitter.emit("incrementCount", "directRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentDirectRegistrationSucceeded",
          true
        );
        logEmitter.emit(
          "functionSuccess",
          "submissions.router",
          "createNewDirectRegistration-v3"
        );
        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "submissions.router",
          "createNewDirectRegistration-v3",
          req.body
        );
        statusEmitter.emit("incrementCount", "directRegistrationsFailed");
        statusEmitter.emit(
          "setStatus",
          "mostRecentDirectRegistrationSucceeded",
          false
        );
        logEmitter.emit(
          "functionFail",
          "submissions.router",
          "createNewDirectRegistration-v3",
          err
        );
        next(err);
      }
    }
  );

  return router;
};

module.exports = { submissionsRouter };
