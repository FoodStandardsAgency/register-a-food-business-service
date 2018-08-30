const { Router } = require("express");
const registrationController = require("./registration.controller");
const {
  createRegistrationAuth,
  viewDeleteRegistrationAuth
} = require("../../middleware/authHandler");
const { logEmitter } = require("../../services/logging.service");

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
        const response = await registrationController.createNewRegistration(
          req.body.registration,
          req.body.local_council_url
        );
        logEmitter.emit(
          "functionSuccess",
          "registration.router",
          "createNewRegistration"
        );
        res.send(response);
      } catch (err) {
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
