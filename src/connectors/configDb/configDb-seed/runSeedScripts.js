require("dotenv").config();
const { info } = require("winston");
const mongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const inquirer = require("inquirer");
const generalQs = require("./questions/general.questions");
const localCouncilQs = require("./questions/localCouncil.questions");
const configVersionQs = require("./questions/configVersion.questions");
const localCouncilTemplate = require("./templates/localCouncil.template");
const configVersionTemplate = require("./templates/configVersion.template");

const questions = {
  general: generalQs,
  localCouncil: localCouncilQs,
  configVersion: configVersionQs
};

const templates = {
  localCouncil: localCouncilTemplate,
  configVersion: configVersionTemplate
};

const establishConnectionToMongo = async configDbUrl => {
  const client = await mongoClient.connect(configDbUrl, {
    useNewUrlParser: true
  });

  const configDB = client.db("register_a_food_business_config");
  return configDB;
};

const backupExistingData = (data, fileName) => {
  fs.writeFileSync(`./saved-data/${fileName}.json`, JSON.stringify(data));
};

const runSeed = async () => {
  // get the collection that the user wants to seed
  const collectionToSeed = await inquirer.prompt(
    questions.general.collectionQuestion
  );

  // get the environments that the user wants to seed to
  const environmentsToSeed = await inquirer.prompt(
    questions.general.envQuestions
  );

  // get the configDB urls for these environments, and confirm that they are correct
  const requiredEnvUrlQuestions = questions.general.envUrlQuestions.filter(
    envQ => environmentsToSeed.environments.includes(envQ.env)
  );
  let environmentUrls;
  let environmentUrlsAreCorrect = { confirmation_env_urls: false };
  while (environmentUrlsAreCorrect.confirmation_env_urls === false) {
    environmentUrls = await inquirer.prompt(requiredEnvUrlQuestions);
    environmentUrlsAreCorrect = await inquirer.prompt(
      questions.general.confirmEnvUrls
    );
  }

  // get the full list of questions that are needed to seed data to
  // the user's choice of environment and collection and check that answers are correct
  const allCollectionQuestions = questions[collectionToSeed.collectionName];
  const requiredCollectionQuestions = allCollectionQuestions.filter(
    collectionQ =>
      environmentsToSeed.environments.some(envName =>
        collectionQ.env.includes(envName)
      )
  );
  let seedData;
  let seedDataIsCorrect = { confirmation_seed_data: false };
  while (seedDataIsCorrect.confirmation_seed_data === false) {
    seedData = await inquirer.prompt(requiredCollectionQuestions);
    seedDataIsCorrect = await inquirer.prompt(
      questions.general.confirmSeedData
    );
  }

  // for each environment...
  for (let index in environmentsToSeed.environments) {
    try {
      const envName = environmentsToSeed.environments[index];

      // make a connection to the config database, for this collection, in this environment
      const configDbUrl = environmentUrls[envName];
      const configDB = await establishConnectionToMongo(configDbUrl);
      const specifiedCollection = configDB.collection(
        collectionToSeed.collectionName
      );

      // back up the existing data from this collection
      const entireCollectionCursor = await specifiedCollection.find({});
      const entireCollectionData = await entireCollectionCursor.toArray();
      backupExistingData(
        entireCollectionData,
        `${envName}-${collectionToSeed.collectionName}-${new Date()}`
      );

      // get a fully populated version of the template for this collection
      const populatedTemplate = templates[collectionToSeed.collectionName](
        seedData,
        envName
      );

      // push the populated template to the database
      await specifiedCollection.insertOne(populatedTemplate);
      info(`SUCCESS. Seed complete for ${envName} environment.`);
    } catch (err) {
      throw new Error(err);
    }
  }

  process.exit(0);
};

runSeed();
