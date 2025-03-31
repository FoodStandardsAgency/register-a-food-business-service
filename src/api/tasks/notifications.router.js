"use strict";

const { Router } = require("express");
const { fail } = require("../../utils/express/response");
const { logEmitter } = require("../../services/logging.service");

const {
  sendNotificationsForRegistrationAction,
  sendAllNotificationsForRegistrationsAction
} = require("./notifications.controller");

// const { viewDeleteRegistrationAuth } = require("../../middleware/authHandler");

const notificationsRouter = () => {
  const router = Router();

  //apply any middleware
  //router.use(viewDeleteRegistrationAuth);

  // Send unsent emails for all registrations
  router.get("/bulk/sendnotification", async (req, res) => {
    logEmitter.emit("functionCall", "notifications.router", "bulk/sendnotification");
    let dryrun = !!req.query.dryrun;
    let throttle = req.query && req.query.throttle ? req.query.throttle : 500;

    try {
      await sendAllNotificationsForRegistrationsAction(req, res, dryrun, throttle);
    } catch (e) {
      logEmitter.emit("functionFail", "notifications.router", "bulk/sendnotification");
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit("functionSuccess", "notifications.router", "bulk/sendnotification");
  });

  // Send unsent emails for a single registrations
  router.get("/sendnotification/:fsaId", async (req, res) => {
    logEmitter.emit("functionCall", "notifications.router", "sendnotification/:fsaId");
    const { fsaId = null } = req.params;
    try {
      await sendNotificationsForRegistrationAction(fsaId, req, res);
    } catch (e) {
      logEmitter.emit("functionFail", "notifications.router", "sendnotification/:fsaId");
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit("functionSuccess", "notifications.router", "sendnotification/:fsaId");
  });

  return router;
};

module.exports = { notificationsRouter };
