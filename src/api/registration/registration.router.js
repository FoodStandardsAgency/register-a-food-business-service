const { Router } = require("express");
const registrationController = require("./registration.controller");
const {
  createRegistrationAuth,
  viewDeleteRegistrationAuth
} = require("../../middleware/authHandler");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");

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
      const sendResponse = (response) => {
        statusEmitter.emit("incrementCount", "userRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentUserRegistrationSucceeded",
          true
        );
        res.send(response);
      };
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

        await registrationController.createNewRegistration(
          req.body.registration,
          req.body.local_council_url,
          regDataVersion,
          sendResponse
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
    "/createNewLcSubmittedRegistration",
    createRegistrationAuth,
    async (req, res, next) => {
      logEmitter.emit(
        "functionCall",
        "registration.router",
        "createNewLcSubmittedRegistration"
      );
      const sendResponse = (response) => {
        statusEmitter.emit("incrementCount", "lcRegistrationsSucceeded");
        statusEmitter.emit(
          "setStatus",
          "mostRecentlcRegistrationSucceeded",
          true
        );
        res.send(response);
      };
      try {
        statusEmitter.emit("incrementCount", "lcSubmissionsReceived");

        const regDataVersion = req.headers["registration-data-version"];

        await registrationController.createNewLcRegistration(
          req.body,
          regDataVersion,
          sendResponse
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
          "createNewLcSubmittedRegistration"
        );
      } catch (err) {
        logEmitter.emit(
          "errorWith",
          "registration.router",
          "createNewLcSubmittedRegistration",
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
          "createNewLcSubmittedRegistration",
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
