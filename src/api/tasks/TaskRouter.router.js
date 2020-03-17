"use strict";

const { Router } = require("express");
const { isEmpty } = require("lodash");
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const { success, fail } = require("../../utils/express/response");

const {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction
} = require("./Tasks.controller");

const { viewDeleteRegistrationAuth } = require("../../middleware/authHandler");

const TaskRouter = () => {
  const router = Router();

  //apply any middleware
  //router.use(viewDeleteRegistrationAuth);

  router.get("/bulk/createtascomiregistration", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendAllOutstandingRegistrationsToTascomiAction(req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  router.get("/createtascomiregistration/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendRegistrationToTascomiAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  // SEND EMAILS AND STUFF
  router.get("/bulk/sendnotification", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendAllNotificationsForRegistrationsAction(req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  router.get("/sendnotification/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendNotificationsForRegistrationAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  //SAVE IN POSTGRES
  router.get("/bulk/sendnotification", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendAllNotificationsForRegistrationsAction(req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  router.get("/savetotempstore/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await saveRegistrationToTempStoreAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  router.get("/bulk/savetotempstore", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await saveAllOutstandingRegistrationsToTempStoreAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message);
    }
  });

  return router;
};

module.exports = { TaskRouter };
