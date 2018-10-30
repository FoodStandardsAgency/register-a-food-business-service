require("dotenv").config();
const mongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const inquirer = require("inquirer");

const establishConnectionToMongo = async configDbUrl => {
  client = await mongoClient.connect(configDbUrl, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");
};

const saveDataLocally = (data, fileName) => {
  fs.writeFileSync(`./saved-data/${fileName}.json`, JSON.stringify(data));
};

const runSeed = async () => {
  // get the actions that the user wants to take (what they want to seed)
  // inquirer.prompt() - generalQuestions.collectionQuestions
  // get the environments that the user wants to seed to
  // generalQuestions.envQuestions
  // get the urls that are required for these environments
  // generalQuestions.envUrlQuestions
  // check that the user is happy with the urls for each environment
  // generalQuestions.confirm ... or maybe an inquirer feature? E.g. confirm
  // get the full set of data required for the requested action on the requested environments
  // new function: getActionAnswers() - this should call configVersionQuestions for example, based on action specified
  // check that the user is happy with the full set of data (inc. path etc.)
  // generalQuestions.confirm() ... or maybe an inquirer feature? E.g. confirm
  // connect to Mongo
  // establishConnectionToMongo
  // set a variable to the mongodb collection object, based on their answer
  // get the existing data for the collection in question
  // save a backup of the existing data
  // saveDataLocally() - pass in the collection object only??
  // create a new document/entry locally with the data
  // generateNewEntry() - pass in the collection name only
  // push a new document/entry to the collection
  // pushDataToDb() - pass in the collection object and the data
  // disconnect from Mongo?
  // process.exit(0);
};

runSeed();
