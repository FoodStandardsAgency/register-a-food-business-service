"use strict";

const { Router } = require("express");
const { isEmpty } = require('lodash');
const { logEmitter } = require("../../services/logging.service");
const { statusEmitter } = require("../../services/statusEmitter.service");
const {success, fail} = require('../../utils/express/response');


const {
    sendOutstandingRegistrationsToTascomi,
    sendRegistrationToTascomiAction,
    sendNotificationsForRegistrationAction,
    saveRegistrationsToTempStoreAction
}  = require('./Tasks.controller');

const {viewDeleteRegistrationAuth} = require("../../middleware/authHandler");

const TaskRouter = () => {
    const router = Router();

    //apply any middleware
    //router.use(viewDeleteRegistrationAuth);

    router.get('/bulk/createtascomiregistration', async (req, res)=>{
        const {fsaId=null} = req.params;
        try {
            await sendOutstandingRegistrationsToTascomi(req, res);
        }
        catch(e) {
            await fail(406, res, e.message);
        }
    });

    router.get('/createtascomiregistration/:fsaId', async (req, res)=>{
        const {fsaId=null} = req.params;
        try {
            await sendRegistrationToTascomiAction(fsaId, req, res);
        }
        catch(e) {
            await fail(406, res, e.message);
        }
    });


    // SEND EMAILS AND STUFF
    router.get('/sendnotification/:fsaId', async (req, res)=>{
        const {fsaId=null} = req.params;
        try {
            await sendNotificationsForRegistrationAction(fsaId, req, res);
        }
        catch(e) {
            await fail(406, res, e.message);
        }
    });

    //SAVE IN POSTGRES
    router.get('/savetotempstore/:fsaId', async (req, res)=>{
        const {fsaId=null} = req.params;
        try {
            await saveRegistrationsToTempStoreAction(fsaId, req, res);
        }
        catch(e) {
            await fail(406, res, e.message);
        }
    });

    return router;
};

module.exports = { TaskRouter };