require("dotenv").config();
const mongoClient = require("mongodb").MongoClient;
const { info, error } = require("winston");
const fs = require("fs");
const newLc = require("./newLc");
const newPath = require("./newPath");
const newNotify = require("./newNotify");

const envUrls = {
  dev: process.env.SEED_CONFIGDB_URL_DEV,
  test: process.env.SEED_CONFIGDB_URL_TEST,
  staging: process.env.SEED_CONFIGDB_URL_STAGING,
  production: process.env.SEED_CONFIGDB_URL_PRODUCTION
};

const envVarsForProduction = {
  newLc: [
    process.env.SEED_LC_EMAIL,
    process.env.SEED_LC_NOTIFY_EMAILS,
    process.env.SEED_LC_PHONE_NUMBER,
    process.env.SEED_TASCOMI_URL_LC,
    process.env.SEED_TASCOMI_PUBLIC_KEY_LC,
    process.env.SEED_TASCOMI_PRIVATE_KEY_LC
  ],
  newPath: [process.env.SEED_DATA_VERSION],
  newNotify: [
    process.env.SEED_DATA_VERSION,
    process.env.SEED_NOTIFY_TEMPLATE_FBO,
    process.env.SEED_NOTIFY_TEMPLATE_LC
  ]
};

const envVarsForOthers = {
  newLc: [
    process.env.SEED_TASCOMI_URL_DEV,
    process.env.SEED_TASCOMI_PUBLIC_KEY_DEV,
    process.env.SEED_TASCOMI_PRIVATE_KEY_DEV
  ],
  newPath: [],
  newNotify: [
    process.env.SEED_NOTIFY_TEMPLATE_FBO,
    process.env.SEED_NOTIFY_TEMPLATE_LC
  ]
};

let client;
let configDB;
let lcConfigCollection;
let pathConfigCollection;
let notifyConfigCollection;

const establishConnectionToMongo = async configDbUrl => {
  client = await mongoClient.connect(configDbUrl, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");
};

const saveDataLocally = (data, fileName) => {
  fs.writeFileSync(`./saved-data/${fileName}.json`, JSON.stringify(data));
};

const checkRequiredEnvVars = (env, dataType) => {
  let listOfRequiredVars;

  if (env === "production") {
    listOfRequiredVars = envVarsForProduction;
  } else {
    listOfRequiredVars = envVarsForOthers;
  }

  listOfRequiredVars[dataType].forEach(variable => {
    if (!variable) {
      throw new Error(`Missing env var for environment: "${env}".`);
    }
  });
};

const seedNewLc = async () => {
  for (let env in envUrls) {
    checkRequiredEnvVars(env, "newLc");

    // connect to the config db for this environment
    await establishConnectionToMongo(envUrls[env]);

    // find and save LC config into a file locally before replacement
    lcConfigCollection = configDB.collection("lcConfig");
    const existingLcConfigCursor = await lcConfigCollection.find({});
    const existingLcConfigData = await existingLcConfigCursor.toArray();
    saveDataLocally(
      existingLcConfigData,
      `${env}-lcConfigBeforeReplacement-${new Date()}`
    );

    // generate the new entry based on the current env
    const newLcEntry = newLc(env);

    // add the new entry
    await lcConfigCollection.insert(newLcEntry);

    // find and log all updated LC config
    const lcConfigSearchResult = await lcConfigCollection.find({});
    await lcConfigSearchResult.forEach(info);
  }
  process.exit(0);
};

const seedNewPath = async () => {
  for (let env in envUrls) {
    checkRequiredEnvVars(env, "newPath");

    // connect to the config db for this environment
    await establishConnectionToMongo(envUrls[env]);

    // find and save path config into a file locally before replacement
    pathConfigCollection = configDB.collection("pathConfig");
    const existingPathConfigCursor = await pathConfigCollection.find({});
    const existingPathConfigData = await existingPathConfigCursor.toArray();
    saveDataLocally(
      existingPathConfigData,
      `${env}-pathConfigBeforeReplacement-${new Date()}`
    );

    // add the new entry
    await pathConfigCollection.insert(newPath);

    // find and log all updated path config
    const pathConfigSearchResult = await pathConfigCollection.find({});
    await pathConfigSearchResult.forEach(info);
  }
  process.exit(0);
};

const seedNewNotify = async () => {
  for (let env in envUrls) {
    checkRequiredEnvVars(env, "newNotify");

    // connect to the config db for this environment
    await establishConnectionToMongo(envUrls[env]);

    // find and save Notify config into a file locally before replacement
    notifyConfigCollection = configDB.collection("notifyConfig");
    const existingNotifyConfigCursor = await notifyConfigCollection.find({});
    const existingNotifyConfigData = await existingNotifyConfigCursor.toArray();
    saveDataLocally(
      existingNotifyConfigData,
      `${env}-notifyConfigBeforeReplacement-${new Date()}`
    );

    // add the new entry
    await notifyConfigCollection.insert(newNotify);

    // find and log all updated Notify config
    const notifyConfigSearchResult = await notifyConfigCollection.find({});
    await notifyConfigSearchResult.forEach(info);
  }
  process.exit(0);
};

const runSeed = async () => {
  const seedScripts = {
    seedNewLc,
    seedNewPath,
    seedNewNotify
  };

  const processArgSeedScriptName = process.argv[2];
  try {
    await seedScripts[processArgSeedScriptName]();
  } catch (err) {
    error(
      "SEED FAILED. Check that the new record has a new _id property, as overwriting existing records is not possible."
    );
    error(err);
  }
};

runSeed();
