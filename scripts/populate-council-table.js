const mongodb = require("mongodb");
const { CONFIGDB_URL } = require("../src/db/config/config");
const { logEmitter } = require("../src/services/logging.service");
const { Council, connectToDb, closeConnection } = require("../src/db/db");

let client;
let configDB;
let lcConfigCollection;

const establishConnectionToMongo = async () => {
  client = await mongodb.MongoClient.connect(CONFIGDB_URL, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");

  lcConfigCollection = configDB.collection("lcConfig");
};

const getLocalCouncils = async () => {
  let localCouncils = null;
  logEmitter.emit(
    "functionCall",
    "configDb.council.script",
    "getLocalCouncils"
  );

  try {
    await establishConnectionToMongo();

    localCouncils = await lcConfigCollection.find({
      $and: [
        { local_council_url: { $ne: "" } },
        { local_council_url: { $ne: null } }
      ]
    });

    if (localCouncils !== null) {
      localCouncils = localCouncils.map(res => ({
        competent_authority_id: res._id,
        local_council: res.local_council,
        local_council_url: res.local_council_url
      }));
    }
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "configDb.council.script",
      "getLocalCouncils",
      err
    );

    const newError = new Error();
    newError.name = "mongoConnectionError";
    newError.message = err.message;

    throw newError;
  }
  return localCouncils;
};

const modelCreate = async (data, model) => {
  const response = await model.create(data);
  return response;
};

const run = async () => {
  await connectToDb();
  const data = await getLocalCouncils();
  const promises = [];
  console.log("working");
  data.forEach(async record => {
    promises.push(modelCreate(record, Council));
  });
  await Promise.all(promises);
  closeConnection();
};

run();
