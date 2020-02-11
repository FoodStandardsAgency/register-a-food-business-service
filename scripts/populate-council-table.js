require("dotenv").config();
const mongodb = require("mongodb");
const { logEmitter } = require("../src/services/logging.service");
const { Council, connectToDb, closeConnection } = require("../src/db/db");

let client;
let configDB;
let lcConfigCollection;

const establishConnectionToMongo = async () => {
  client = await mongodb.MongoClient.connect(process.env.CONFIGDB_URL, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");

  lcConfigCollection = configDB.collection("lcConfig");
};

const getLocalCouncils = async () => {
  let localCouncils = null;
  logEmitter.emit("functionCall", "populate-council-table", "getLocalCouncils");

  try {
    await establishConnectionToMongo();

    localCouncils = await lcConfigCollection
      .find({
        $and: [
          { local_council_url: { $ne: "" } },
          { local_council_url: { $ne: null } }
        ]
      })
      .toArray();

    if (localCouncils !== null) {
      localCouncils = localCouncils.map(res => ({
        competent_authority_id: res._id,
        local_council_full_name: res.local_council,
        local_council_url: res.local_council_url
      }));
    }
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "populate-council-table",
      "getLocalCouncils",
      err
    );

    throw err;
  }

  logEmitter.emit(
    "functionSuccess",
    "populate-council-table",
    "getLocalCouncils"
  );

  return localCouncils;
};

const modelCreate = async (data, model, transaction) => {
  const response = await model.create(data, { transaction: transaction });
  return response;
};

const populateCouncils = async transaction => {
  await connectToDb();
  const data = await getLocalCouncils();
  const promises = [];
  console.log(data);
  try {
    data.forEach(async record => {
      promises.push(modelCreate(record, Council, transaction));
    });
    await Promise.all(promises);
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "populate-council-table",
      "populateCouncils",
      err
    );

    throw err;
  }
  client.close();
  await closeConnection();

  logEmitter.emit(
    "functionSuccess",
    "populate-council-table",
    "populateCouncils"
  );
};

module.exports = { populateCouncils };
