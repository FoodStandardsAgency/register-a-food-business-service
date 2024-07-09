const { Router } = require("express");
const submissionsController = require("./submissions.controller");
const { createRegistrationAuth } = require("../../middleware/authHandler");
const { logEmitter } = require("../../services/logging.service");
const REGISTRATION_FAILURE = "Registration creation failure";
const DIRECT_REGISTRATION_FAILURE = "Direct registration creation failure";
const REGISTRATION_SUCCESS = "Registration creation success";
const DIRECT_REGISTRATION_SUCCESS = "Direct registration creation success";

const submissionsRouter = () => {
  const router = Router();

  router.post("/createNewRegistration", createRegistrationAuth, async (req, res, next) => {
    logEmitter.emit("functionCall", "submissions.router", "createNewRegistration");
    try {
      const regDataVersion = req.headers["registration-data-version"];

      if (regDataVersion === undefined) {
        const missingHeaderError = new Error("Missing 'registration-data-version' header");
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
      logEmitter.emit("info", REGISTRATION_SUCCESS); // Used for Azure alerts
      logEmitter.emit("functionSuccess", "submissions.router", "createNewRegistration");

      res.send(response);
    } catch (err) {
      logEmitter.emit(
        "errorWith",
        "submissions.router",
        "createNewRegistration",
        req.body.registration
      );
      logEmitter.emit("warning", REGISTRATION_FAILURE); // Used for Azure alerts
      logEmitter.emit("functionFail", "submissions.router", "createNewRegistration", err);
      next(err);
    }
  });

  router.post(
    "/v2/createNewDirectRegistration/:subscriber",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit("functionCall", "submissions.router", "createNewDirectRegistration");
      try {
        const options = {
          apiVersion: req.headers["api-version"] || "v2.1",
          subscriber: req.params.subscriber || "",
          requestedCouncil: req.query["local-authority"] || req.params.subscriber
        };

        let response;
        response = await submissionsController.createNewDirectRegistration(req.body, options);

        logEmitter.emit("info", DIRECT_REGISTRATION_SUCCESS); // Used for Azure alerts
        res.send(response);
      } catch (err) {
        logEmitter.emit("errorWith", "submissions.router", "createNewDirectRegistration", req.body);
        logEmitter.emit("warning", DIRECT_REGISTRATION_FAILURE); // Used for Azure alerts
        logEmitter.emit("functionFail", "submissions.router", "createNewDirectRegistration", err);
        next(err);
      }
    }
  );

  router.post(
    "/v3/createNewDirectRegistration/:subscriber",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit("functionCall", "submissions.router", "createNewDirectRegistration-v3");
      try {
        const options = {
          apiVersion: req.headers["api-version"] || "v3.0",
          subscriber: req.params.subscriber || "",
          requestedCouncil: req.query["local-authority"] || req.params.subscriber
        };

        let response;

        response = await submissionsController.createNewDirectRegistration(req.body, options);
        logEmitter.emit("info", DIRECT_REGISTRATION_SUCCESS); // Used for Azure alerts
        logEmitter.emit("functionSuccess", "submissions.router", "createNewDirectRegistration-v3");
        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "submissions.router",
          "createNewDirectRegistration-v3",
          req.body
        );
        logEmitter.emit("warning", DIRECT_REGISTRATION_FAILURE); // Used for Azure alerts
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

  router.post(
    "/v4/createNewDirectRegistration/:subscriber",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit("functionCall", "submissions.router", "createNewDirectRegistration-v4");
      try {
        const options = {
          apiVersion: req.headers["api-version"] || "v4.0",
          subscriber: req.params.subscriber || "",
          requestedCouncil: req.query["local-authority"] || req.params.subscriber
        };

        let response;

        response = await submissionsController.createNewDirectRegistration(req.body, options);
        logEmitter.emit("info", DIRECT_REGISTRATION_SUCCESS); // Used for Azure alerts
        logEmitter.emit("functionSuccess", "submissions.router", "createNewDirectRegistration-v4");
        res.send(response);
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "submissions.router",
          "createNewDirectRegistration-v4",
          req.body
        );
        logEmitter.emit("warning", DIRECT_REGISTRATION_FAILURE); // Used for Azure alerts
        logEmitter.emit(
          "functionFail",
          "submissions.router",
          "createNewDirectRegistration-v4",
          err
        );
        next(err);
      }
    }
  );

  return router;
};

module.exports = { submissionsRouter };
