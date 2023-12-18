const { Router } = require("express");
const { logEmitter } = require("../../services/logging.service");
const {
  getRegistrationsByCouncil,
  getRegistration,
  getRegistrations,
  updateRegistration
} = require("./collections.v3.controller");

const collectionsV3Router = () => {
  const router = Router();

  router.get("/unified", async (req, res, next) => {
    logEmitter.emit(
      "functionCall",
      "registrations.v3.router",
      "GET /unified route"
    );
    try {
      let registrations;
      const options = {
        after: req.query.after,
        before: req.query.before
      };

      registrations = await getRegistrations(options);

      logEmitter.emit(
        "functionSuccess",
        "registrations.v3.router",
        "GET /unified route"
      );
      res.send(registrations);
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "registrations.v3.router",
        "GET /unified route",
        err
      );
      next(err);
    }
  });

  router.get("/:subscriber", async (req, res, next) => {
    logEmitter.emit(
      "functionCall",
      "registrations.v3.router",
      "/:subscriber route"
    );
    try {
      const fields = req.query.fields ? req.query.fields.split(",") : [];
      const options = {
        new: req.query.new || "true",
        fields,
        subscriber: req.params.subscriber,
        after: req.query.after || new Date("2000-01-01").toISOString(),
        before: req.query.before || new Date(Date.now()).toISOString(),
        requestedCouncils: req.query["local-authorities"]
          ? req.query["local-authorities"].split(",")
          : [req.params.subscriber]
      };

      const registrations = await getRegistrationsByCouncil(options);

      logEmitter.emit(
        "functionSuccess",
        "registrations.v3.router",
        "GET /:subscriber route"
      );
      res.send(registrations);
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "registrations.v3.router",
        "GET /:subscriber route",
        err
      );
      next(err);
    }
  });

  router.get("/:subscriber/:fsa_rn", async (req, res, next) => {
    logEmitter.emit(
      "functionCall",
      "registrations.v3.router",
      "GET /:subscriber/:fsa_rn route"
    );
    try {
      const options = {
        fsa_rn: req.params.fsa_rn,
        subscriber: req.params.subscriber,
        requestedCouncil: req.query["local-authority"] || req.params.subscriber
      };

      const registration = await getRegistration(options);

      logEmitter.emit(
        "functionSuccess",
        "registrations.v3.router",
        "GET /:subscriber/:fsa_rn route"
      );
      res.send(registration);
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "registrations.v3.router",
        "GET /:subscriber/:fsa_rn route",
        err
      );
      next(err);
    }
  });

  router.put("/:subscriber/:fsa_rn", async (req, res, next) => {
    logEmitter.emit(
      "functionCall",
      "registrations.v3.router",
      "PUT /:subscriber/:fsa_rn route"
    );
    try {
      const options = {
        collected: req.body.collected,
        fsa_rn: req.params.fsa_rn,
        subscriber: req.params.subscriber,
        requestedCouncil: req.query["local-authority"] || req.params.subscriber
      };

      const response = await updateRegistration(options);

      logEmitter.emit(
        "functionSuccess",
        "registrations.v3.router",
        "PUT /:subscriber/:fsa_rn route"
      );
      res.send(response);
    } catch (err) {
      logEmitter.emit(
        "functionFail",
        "registrations.v3.router",
        "PUT /:subscriber/:fsa_rn route",
        err
      );
      next(err);
    }
  });

  return router;
};

module.exports = { collectionsV3Router };
