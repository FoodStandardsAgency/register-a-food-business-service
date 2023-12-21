const { Router } = require("express");
const { logEmitter } = require("../../services/logging.service");
const {
  getRegistrationsByCouncil,
  getRegistration,
  getRegistrations,
  updateRegistration
} = require("./collections.controller");

const collectionsRouter = () => {
  const router = Router();

  router.get("/unified", async (req, res, next) => {
    logEmitter.emit("functionCall", "registrations.router", "GET /unified route");
    try {
      let registrations;
      const options = {
        after: req.query.after,
        before: req.query.before
      };

      registrations = await getRegistrations(options);

      logEmitter.emit("functionSuccess", "registrations.router", "GET /unified route");
      res.send(registrations);
    } catch (err) {
      logEmitter.emit("functionFail", "registrations.router", "GET /unified route", err);
      next(err);
    }
  });

  router.get("/:lc", async (req, res, next) => {
    logEmitter.emit("functionCall", "registrations.router", "/:lc route");
    try {
      const fields = req.query.fields ? req.query.fields.split(",") : [];
      const options = {
        new: req.query.new || "true",
        fields,
        council: req.params.lc,
        after: req.query.after || new Date("2000-01-01").toISOString(),
        before: req.query.before || new Date(Date.now()).toISOString()
      };

      const registrations = await getRegistrationsByCouncil(options);

      logEmitter.emit("functionSuccess", "registrations.router", "GET /:lc route");
      res.send(registrations);
    } catch (err) {
      logEmitter.emit("functionFail", "registrations.router", "GET /:lc route", err);
      next(err);
    }
  });

  router.get("/:lc/:fsa_rn", async (req, res, next) => {
    logEmitter.emit("functionCall", "registrations.router", "GET /:lc/:fsa_rn route");
    try {
      const options = {
        fsa_rn: req.params.fsa_rn,
        council: req.params.lc
      };

      const registration = await getRegistration(options);

      logEmitter.emit("functionSuccess", "registrations.router", "GET /:lc/:fsa_rn route");
      res.send(registration);
    } catch (err) {
      logEmitter.emit("functionFail", "registrations.router", "GET /:lc/:fsa_rn route", err);
      next(err);
    }
  });

  router.put("/:lc/:fsa_rn", async (req, res, next) => {
    logEmitter.emit("functionCall", "registrations.router", "PUT /:lc/:fsa_rn route");
    try {
      const options = {
        collected: req.body.collected,
        fsa_rn: req.params.fsa_rn,
        council: req.params.lc
      };

      const response = await updateRegistration(options);

      logEmitter.emit("functionSuccess", "registrations.router", "PUT /:lc/:fsa_rn route");
      res.send(response);
    } catch (err) {
      logEmitter.emit("functionFail", "registrations.router", "PUT /:lc/:fsa_rn route", err);
      next(err);
    }
  });

  return router;
};

module.exports = { collectionsRouter };
