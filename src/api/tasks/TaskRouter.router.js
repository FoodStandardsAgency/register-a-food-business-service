"use strict";

const { Router } = require("express");
const { fail } = require("../../utils/express/response");
const { logEmitter } = require("../../services/logging.service");

const {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction
} = require("./Tasks.controller");

// const { viewDeleteRegistrationAuth } = require("../../middleware/authHandler");

const TaskRouter = () => {
  const router = Router();

  //apply any middleware
  //router.use(viewDeleteRegistrationAuth);

  router.get("/bulk/createtascomiregistration", async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "TaskRouter.router",
      "bulk/createtascomiregistration"
    );
    let dryrun = !!req.query.dryrun;
    let throttle = req.query && req.query.throttle ? req.query.throttle : 500;
    try {
      await sendAllOutstandingRegistrationsToTascomiAction(
        req,
        res,
        dryrun,
        throttle
      );
    } catch (e) {
      logEmitter.emit(
        "functionFail",
        "TaskRouter.router",
        "bulk/createtascomiregistration"
      );
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit(
      "functionSuccess",
      "TaskRouter.router",
      "bulk/createtascomiregistration"
    );
  });

  router.get("/createtascomiregistration/:fsaId", async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "TaskRouter.router",
      "createtascomiregistration/:fsaId"
    );
    const { fsaId = null } = req.params;
    try {
      await sendRegistrationToTascomiAction(fsaId, req, res);
    } catch (e) {
      logEmitter.emit(
        "functionFail",
        "TaskRouter.router",
        "createtascomiregistration/:fsaId"
      );
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit(
      "functionSuccess",
      "TaskRouter.router",
      "createtascomiregistration/:fsaId"
    );
  });

  // SEND EMAILS AND STUFF
  router.get("/bulk/sendnotification", async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "TaskRouter.router",
      "bulk/sendnotification"
    );
    let dryrun = !!req.query.dryrun;
    let throttle = req.query && req.query.throttle ? req.query.throttle : 500;

    try {
      await sendAllNotificationsForRegistrationsAction(
        req,
        res,
        dryrun,
        throttle
      );
    } catch (e) {
      logEmitter.emit(
        "functionFail",
        "TaskRouter.router",
        "bulk/sendnotification"
      );
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit(
      "functionSuccess",
      "TaskRouter.router",
      "bulk/sendnotification"
    );
  });

  router.get("/sendnotification/:fsaId", async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "TaskRouter.router",
      "sendnotification/:fsaId"
    );
    const { fsaId = null } = req.params;
    try {
      await sendNotificationsForRegistrationAction(fsaId, req, res);
    } catch (e) {
      logEmitter.emit(
        "functionFail",
        "TaskRouter.router",
        "sendnotification/:fsaId"
      );
      await fail(406, res, e.message);
      throw e;
    }
    logEmitter.emit(
      "functionSuccess",
      "TaskRouter.router",
      "sendnotification/:fsaId"
    );
  });

  return router;
};

module.exports = { TaskRouter };
