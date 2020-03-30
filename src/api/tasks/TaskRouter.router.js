"use strict";

const { Router } = require("express");
const { fail } = require("../../utils/express/response");

const {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction
} = require("./Tasks.controller");

// const { viewDeleteRegistrationAuth } = require("../../middleware/authHandler");

const TaskRouter = () => {
  const router = Router();

  //apply any middleware
  //router.use(viewDeleteRegistrationAuth);

  router.get("/bulk/createtascomiregistration", async (req, res) => {
    let dryrun = !!req.query.dryrun;
    try {
      await sendAllOutstandingRegistrationsToTascomiAction(req, res, dryrun);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  router.get("/createtascomiregistration/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendRegistrationToTascomiAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  // SEND EMAILS AND STUFF
  router.get("/bulk/sendnotification", async (req, res) => {
    let dryrun = !!req.query.dryrun;
    try {
      await sendAllNotificationsForRegistrationsAction(req, res, dryrun);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  router.get("/sendnotification/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await sendNotificationsForRegistrationAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  //SAVE IN POSTGRES
  router.get("/savetotempstore/:fsaId", async (req, res) => {
    const { fsaId = null } = req.params;
    try {
      await saveRegistrationToTempStoreAction(fsaId, req, res);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  router.get("/bulk/savetotempstore", async (req, res) => {
    let dryrun = !!req.query.dryrun;
    try {
      await saveAllOutstandingRegistrationsToTempStoreAction(req, res, dryrun);
    } catch (e) {
      await fail(406, res, e.message || e);
    }
  });

  return router;
};

module.exports = { TaskRouter };
