require("dotenv").config();
const mongodb = require("mongodb");
const { logEmitter, INFO } = require("../src/services/logging.service");
const {connectToDb, closeConnection} = require("../src/db/db");
const {getCouncilByUrl, createCouncil } = require("../src/connectors/registrationDb/registrationDb");

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
  logEmitter.emit("functionCall", "sync-council-table", "getLocalCouncils");

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
        local_council_id: res._id,
        local_council_full_name: res.local_council,
        local_council_url: res.local_council_url,
        local_council_phone_number: res.local_council_phone_number,
        local_council_email: res.local_council_email,
        country: res.country,
        separate_standards_council: res.separate_standards_council,
        local_council_notify_emails: res.local_council_notify_emails,
        auth: res.auth,
      }));
    }
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "sync-council-table",
      "getLocalCouncils",
      err
    );

    throw err;
  }

  logEmitter.emit(
    "functionSuccess",
    "sync-council-table",
    "getLocalCouncils"
  );

  return localCouncils;
};

const syncCouncils = async transaction => {
  await connectToDb();
  const data = await getLocalCouncils();
  let model;

  for (const record of data) {
    model = await getCouncilByUrl(record.local_council_url);

    logEmitter.emit(
        INFO,
        `Done ${record.local_council_url}`
    );

    if (model === null) {
      model = await createCouncil(data, transaction);
    }

    //sync stuff
    model.local_council_id = record.local_council_id;
    model.local_council = record.local_council;
    model.local_council_email = record.local_council_email;
    model.local_council_phone_number = record.local_council_phone_number;
    model.country = record.country;
    model.separate_standards_council = record.separate_standards_council;
    model.local_council_notify_emails = record.local_council_notify_emails;
    model.auth = record.auth;

    await model.save();
  }
  console.log("All models were synchronized successfully.");

  client.close();
  await closeConnection();

  logEmitter.emit(
    "functionSuccess",
    "sync-council-table",
    "syncCouncils"
  );
};

module.exports = { syncCouncils };
