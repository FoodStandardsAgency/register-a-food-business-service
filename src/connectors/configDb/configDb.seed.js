const mongoClient = require("mongodb").MongoClient;
const { MONGO_CONFIGDB_CONNECTION_STRING } = require("../../config");
const { info } = require("winston");

const arrayToInsert = [
  {
    _id: 6008,
    lcName: "Mid & East Antrim Borough Council",
    lcEmails: ["fsatestemail.valid@gmail.com"]
  },
  {
    _id: 8020,
    lcName: "Bridgend County Borough Council",
    lcEmails: []
  },
  {
    _id: 4221,
    lcName: "West Dorset District Council",
    lcEmails: ["fsatestemail.valid@gmail.com"],
    separateStandardsCouncil: 4226
  },
  {
    _id: 4223,
    lcName: "North Dorset District Council",
    lcEmails: ["fsatestemail.valid@gmail.com"],
    separateStandardsCouncil: 4226
  },
  {
    _id: 4220,
    lcName: "Weymouth and Portland Borough Council",
    lcEmails: ["fsatestemail.valid@gmail.com"],
    separateStandardsCouncil: 4226
  },
  {
    _id: 4226,
    lcName: "Dorset County Council",
    lcEmails: ["fsatestemail.valid@gmail.com"]
  }
];

let client;
let configDB;
let lcConfigCollection;

const establishConnectionToMongo = async () => {
  client = await mongoClient.connect(MONGO_CONFIGDB_CONNECTION_STRING, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");

  lcConfigCollection = configDB.collection("lcConfig");
};

const seedDb = async () => {
  await establishConnectionToMongo();

  // empties the collection
  await lcConfigCollection.deleteMany({});

  // adds the full list of entries
  await lcConfigCollection.insertMany(arrayToInsert);

  // finds and logs all entries
  const searchResult = await lcConfigCollection.find({});
  await searchResult.forEach(info);

  process.exit(0);
};

seedDb();
