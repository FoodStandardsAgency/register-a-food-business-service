const { Router } = require("express");
const registrationController = require("./registration.controller");
const {
  createRegistrationAuth,
  viewDeleteRegistrationAuth
} = require("../../middleware/authHandler");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const { registrationDouble } = require("./registration.double");

const registrationRouter = () => {
  const router = Router();

  router.post(
    "/createNewRegistration",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit(
        "functionCall",
        "registration.router",
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

        const response = await registrationController.createNewRegistration(
          req.body.registration,
          req.body.local_council_url,
          req.body.submission_language,
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
          "registration.router",
          "createNewRegistration"
        );

        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "registration.router",
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
          "registration.router",
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
        "registration.router",
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
          response = await registrationController.createNewDirectRegistration(
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
          "registration.router",
          "createNewDirectRegistration"
        );
        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "registration.router",
          "createNewDirectRegistration",
          req.body
        );
        statusEmitter.emit("incrementCount", "endToEndRegistrationsFailed");
        statusEmitter.emit(
          "setStatus",
          "mostRecentEndToEndRegistrationSucceeded",
          false
        );
        logEmitter.emit(
          "functionFail",
          "registration.router",
          "createNewDirectRegistration",
          err
        );
        next(err);
      }
    }
  );

  router.get("/:fsa_rn", viewDeleteRegistrationAuth, async (req, res) => {
    logEmitter.emit("functionCall", "registration.router", "viewRegistration");
    const response = await registrationController.getRegistration(
      req.params.fsa_rn
    );
    logEmitter.emit(
      "functionSuccess",
      "registration.router",
      "viewRegistration"
    );
    res.send(response);
  });

  router.delete("/:fsa_rn", viewDeleteRegistrationAuth, async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "registration.router",
      "deleteRegistration"
    );
    const response = await registrationController.deleteRegistration(
      req.params.fsa_rn
    );
    logEmitter.emit(
      "functionSuccess",
      "registration.router",
      "deleteRegistration"
    );
    res.send(response);
  });

  return router;
};

module.exports = { registrationRouter };
