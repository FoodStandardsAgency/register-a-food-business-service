"use strict";

const { logEmitter, INFO, ERROR } = require("../../services/logging.service");
const { sendNotifications } = require("../../services/notifications.service");
const { isEmpty } = require('lodash');
const { success } = require('../../utils/express/response');

const {
    saveRegistration,
    sendTascomiRegistration,
} = require("../registration/registration.service");

const {
    connectToBeCacheDb,
    CachedRegistrationsCollection,
    findOneById,
    updateStatusInCache
} = require("../../connectors/cacheDb/cacheDb.connector");

const {
    findCouncilById,
    connectToConfigDb,
    ConfigDbCollection
} = require("../../connectors/configDb/configDb.connector");

const {
    TASCOMI_SUCCESS,
    TASCOMI_SKIPPING,
    TASCOMI_FAIL
} = require('../../connectors/tascomi/tascomi.connector');

//actions
const sendRegistrationToTascomiAction = async (fsaId, req, res) => {
    //GET REGISTRATION
    const beCacheDb = connectToBeCacheDb();
    const configDb = connectToConfigDb();

    const cachedRegistrations = await CachedRegistrationsCollection(beCacheDb);
    const registration = await findOneById(cachedRegistrations, fsaId);
    if(isEmpty(registration)) {
        let message =  `Could not find registration with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }
    logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

    //GET LOCAL COUNCIL
    let localCouncil = await getCouncilFromConfigDb(configDb, registration);
    if(isEmpty(localCouncil)) {
        let message =  `Could not find local council with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }

    // DO LOOK UP
    if(localCouncil.auth) {
        try{
            //GOT AUTH DATA
            let response = await sendTascomiRegistration(
                registration,
                localCouncil
            );

            //SUCCESS
            await updateStatusInCache(fsaId, "tascomi", TASCOMI_SUCCESS);
        }
        catch(e){
            //FAIL
            logEmitter.emit(ERROR, `Could not push to tascomi for ${fsaId} and local council ${localCouncil._id}. Error: "${err}"`);
            await updateStatusInCache(  fsaId, "tascomi",  TASCOMI_FAIL );
        }
    }
    else{
        console.log('not sending tascomi registraion');

        //NOT APPLICABLE - nothing to update
        await updateStatusInCache(  fsaId, "tascomi", TASCOMI_SKIPPING );
    }

    configDb.close();
    beCacheDb.close();

    await success(res, {fsaId});
};

const sendNotificationsForRegistrationAction = async (fsaId, req, res) => {
    const beCacheDb = connectToBeCacheDb();
    const configDb = connectToConfigDb();

    //GET REGISTRATION
    const cachedRegistrations = await CachedRegistrationsCollection(beCacheDb);
    const registration = await findOneById(cachedRegistrations, fsaId);

    if(isEmpty(registration)) {
        let message =  `Could not find registration with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }
    logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

    //GET LOCAL COUNCIL
    let localCouncil = await getCouncilFromConfigDb(configDb, registration);
    if(isEmpty(localCouncil)) {
        let message =  `Could not find local council with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }

    let configVersion = registration.registrationDataVersion ? registration.registrationDataVersion : null;
    let config = getConfig(configDb, configVersion);
    if(isEmpty(localCouncil)) {
        let message =  `Could not find config ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }

    await sendNotifications(
        localCouncil,
        registration,
        fsaId,
        config
    );

    logEmitter.emit(INFO, `Send notifications for ${fsaId}`);

    configDb.close();
    beCacheDb.close();

    await success(res, {fsaId});
};

const saveRegistrationsAction = async (fsaId, req, res) => {
    const beCacheDb = connectToBeCacheDb();
    const configDb = connectToConfigDb();

    //GET REGISTRATION
    let registration = getRegistration(beCacheDb, fsaId);
    if(isEmpty(registration)) {
        let message =  `Could not find registration with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }

    logEmitter.emit(INFO, `Found registration with ID ${fsaId}`);

    //GET LOCAL COUNCIL
    let localCouncil = await getCouncilFromConfigDb(configDb, registration);
    if(isEmpty(localCouncil)) {
        let message =  `Could not find local council with ID ${fsaId}`;
        logEmitter.emit(ERROR, message);
        throw message;
    }

    await saveRegistration(
        registration,
        fsaId,
        localCouncil.local_council_url
    );

    configDb.close();
    beCacheDb.close();

    await success(res, {fsaId});
};

// Convenience methods for this controller - dont put else where
const getConfig = async (client, configVersion = '1.6.0') => {
    let configCollection = await ConfigDbCollection(client);
    return configCollection.findOne({_id: configVersion });
};

const getRegistration = async (client, fsaId) => {
    const cachedRegistrations = await CachedRegistrationsCollection(client);
    return await findOneById(cachedRegistrations, fsaId);
};

const getCouncilFromConfigDb = async (client, registration) => {
    //this is a strange nasty hack to extract the council id of the initial registration for older records
    const lcConfigCollection = await ConfigDbCollection(client);
    let councilId;
    if(registration.sourceCouncilId){
        // POST feature RS-79
        councilId = registration.sourceCouncilId;
    }
    else{
        // PRE feature RS-79
        councilId = registration.hygieneAndStandards ?  registration.hygieneAndStandards.code : registration.hygiene.code;
    }

    //can return null
    return await findCouncilById(lcConfigCollection, councilId);
};

module.exports = {
    sendRegistrationToTascomiAction,
    sendNotificationsForRegistrationAction,
    saveRegistrationsAction
};