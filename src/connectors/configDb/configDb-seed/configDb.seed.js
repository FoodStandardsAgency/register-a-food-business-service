require("dotenv").config();
const mongoClient = require("mongodb").MongoClient;
const { info, error } = require("winston");
const fs = require("fs");
const inquirer = require("inquirer");
const newLc = require("./newLc");
const newPath = require("./newPath");
const newNotify = require("./newNotify");

const envUrls = {
  dev: process.env.SEED_CONFIGDB_URL_DEV,
  test: process.env.SEED_CONFIGDB_URL_TEST,
  staging: process.env.SEED_CONFIGDB_URL_STAGING,
  production: process.env.SEED_CONFIGDB_URL_PRODUCTION
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

const envAndActionQuestions = [
  {
    type: "checkbox",
    name: "actions",
    message: "What would you like to do?",
    choices: [
      {
        name: "seedNewLc"
      },
      {
        name: "seedNewPath"
      },
      {
        name: "seedNewNotify"
      }
    ],
    validate: answer =>
      answer.length < 1 ? "You must choose at least one action" : true
  },
  {
    type: "checkbox",
    name: "environments",
    message: "Which environments do you want to deploy to?",
    choices: [
      {
        name: "dev",
        checked: true
      },
      {
        name: "test",
        checked: true
      },
      {
        name: "staging",
        checked: true
      },
      {
        name: "production"
      }
    ],
    validate: answer =>
      answer.length < 1 ? "You must choose at least one environment" : true
  }
];

const lcQuestions = {
  allEnvs: [
    {
      type: "input",
      name: "SEED_LC_NAME",
      message: "Enter the display name for the new local council"
    },
    {
      type: "input",
      name: "SEED_LC_EMAIL",
      message:
        "Enter the email address that the council wants displayed to users"
    },
    {
      type: "input",
      name: "SEED_LC_NOTIFY_EMAIL",
      message:
        "Enter the email address that the council wants to be notified on"
    },
    {
      type: "input",
      name: "SEED_LC_PHONE_NUMBER",
      message:
        "(OPTIONAL) Enter the phone number that the council wants displayed to users"
    }
  ],
  nonProduction: [
    {
      type: "input",
      name: "SEED_TASCOMI_URL_DEV",
      message:
        "Enter the SANDBOX Tascomi API URL? (DO NOT ENTER A LIVE API URL)"
    },
    {
      type: "input",
      name: "SEED_TASCOMI_PUBLIC_KEY_DEV",
      message: "Enter the SANDBOX Tascomi PUBLIC key"
    },
    {
      type: "input",
      name: "SEED_TASCOMI_PRIVATE_KEY_DEV",
      message: "Enter the SANDBOX Tascomi PRIVATE key"
    }
  ],
  production: [
    {
      type: "input",
      name: "SEED_TASCOMI_URL_LC",
      message: "Enter the real Tascomi API URL for the new local council"
    },
    {
      type: "input",
      name: "SEED_TASCOMI_PUBLIC_KEY_LC",
      message: "Enter the real Tascomi PUBLIC key for the new local council"
    },
    {
      type: "input",
      name: "SEED_TASCOMI_PRIVATE_KEY_LC",
      message: "Enter the real Tascomi PRIVATE key for the new local council"
    }
  ]
};

const pathQuestions = {
  allEnvs: [
    {
      type: "input",
      name: "SEED_DATA_VERSION_PATH",
      message: "Enter the new PATH data version, e.g. 1.0.0"
    }
  ],
  nonProduction: [],
  production: []
};

const notifyQuestions = {
  allEnvs: [
    {
      type: "input",
      name: "SEED_DATA_VERSION_NOTIFY",
      message: "Enter the new NOTIFY data version, e.g. 1.0.0"
    },
    {
      type: "input",
      name: "SEED_NOTIFY_TEMPLATE_FBO",
      message:
        "Enter the FBO email template ID associated with the NOTIFY data version"
    },
    {
      type: "input",
      name: "SEED_NOTIFY_TEMPLATE_LC",
      message:
        "Enter the LC email template ID associated with the NOTIFY data version"
    }
  ],
  nonProduction: [],
  production: []
};

const runSeed = async () => {
  const envAndActionAnswers = await inquirer.prompt(envAndActionQuestions);

  const dataQuestions = [];

  const productionSelected = envAndActionAnswers.environments.includes(
    "production"
  );

  const nonProductionSelected =
    envAndActionAnswers.environments.includes("dev") ||
    envAndActionAnswers.environments.includes("test") ||
    envAndActionAnswers.environments.includes("staging");

  if (envAndActionAnswers.actions.includes("seedNewLc")) {
    dataQuestions.push(...lcQuestions.allEnvs);
    if (productionSelected) {
      dataQuestions.push(...lcQuestions.production);
    }
    if (nonProductionSelected) {
      dataQuestions.push(...lcQuestions.nonProduction);
    }
  }

  if (envAndActionAnswers.actions.includes("seedNewPath")) {
    dataQuestions.push(...pathQuestions.allEnvs);
    if (productionSelected) {
      dataQuestions.push(...pathQuestions.production);
    }
    if (nonProductionSelected) {
      dataQuestions.push(...pathQuestions.nonProduction);
    }
  }

  if (envAndActionAnswers.actions.includes("seedNewNotify")) {
    dataQuestions.push(...notifyQuestions.allEnvs);
    if (productionSelected) {
      dataQuestions.push(...notifyQuestions.production);
    }
    if (nonProductionSelected) {
      dataQuestions.push(...notifyQuestions.nonProduction);
    }
  }

  const dataAnswers = await inquirer.prompt(dataQuestions);
  for (let answer in dataAnswers) {
    process.env[answer] = dataAnswers[answer];
  }

  const seedScripts = {
    seedNewLc,
    seedNewPath,
    seedNewNotify
  };

  // const processArgSeedScriptName = process.argv[2];
  // try {
  //   await seedScripts[processArgSeedScriptName]();
  // } catch (err) {
  //   error(
  //     "SEED FAILED. Check that the new record has a new _id property, as overwriting existing records is not possible."
  //   );
  //   error(err);
  // }
};

runSeed();
