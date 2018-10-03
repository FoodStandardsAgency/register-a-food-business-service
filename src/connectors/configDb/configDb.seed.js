const mongoClient = require("mongodb").MongoClient;
const { CONFIGDB_URL } = require("../../config");
const { info } = require("winston");

// _id fields are from https://data.food.gov.uk/codes/reference-number/_authority
const arrayToInsert = [
  {
    _id: 8020,
    local_council: "Bridgend County Borough Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "0300 123 6696",
    local_council_url: "bridgend"
  },
  {
    _id: 8015,
    local_council: "City of Cardiff Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "0300 123 6696",
    local_council_url: "cardiff"
  },
  {
    _id: 8002,
    local_council: "Vale of Glamorgan Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "0300 123 6696",
    local_council_url: "the-vale-of-glamorgan"
  },
  {
    _id: 6008,
    local_council: "Mid & East Antrim Borough Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "mid-and-east-antrim"
  },
  {
    _id: 4221,
    local_council: "West Dorset District Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "west-dorset",
    separate_standards_council: 4226
  },
  {
    _id: 4223,
    local_council: "North Dorset District Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "north-dorset",
    separate_standards_council: 4226
  },
  {
    _id: 4220,
    local_council: "Weymouth and Portland Borough Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "weymouth-and-portland",
    separate_standards_council: 4226
  },
  {
    _id: 4226,
    local_council: "Dorset County Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: ""
  }
];

const pathConfigVersions = [
  {
    _id: "1.0.0",
    path: {
      "/index": {
        on: true,
        switches: {
          A1: { "/mock-page-1": false }
        }
      },
      "/mock-page-1": {
        on: true,
        switches: {
          A6: { "/mock-page-2": false },
          A4: { "/mock-page-2": true }
        }
      },
      "/mock-page-2": {
        on: true,
        switches: {
          A7: { "/mock-page-3": false },
          A8: { "/mock-page-2": false }
        }
      }
    }
  }
];

let client;
let configDB;
let lcConfigCollection;
let pathConfigCollection;

const establishConnectionToMongo = async () => {
  client = await mongoClient.connect(CONFIGDB_URL, {
    useNewUrlParser: true
  });

  configDB = client.db("register_a_food_business_config");

  lcConfigCollection = configDB.collection("lcConfig");
  pathConfigCollection = configDB.collection("pathConfig");
};

const seedDb = async () => {
  await establishConnectionToMongo();

  // empties the collection
  await lcConfigCollection.deleteMany({});

  // adds the full list of entries
  await lcConfigCollection.insertMany(arrayToInsert);

  // finds and logs all entries
  const lcConfigSearchResult = await lcConfigCollection.find({});
  await lcConfigSearchResult.forEach(info);

  await pathConfigCollection.deleteMany({});

  // adds the path config
  await pathConfigCollection.insertMany(pathConfigVersions);

  // finds and logs all entries
  const pathConfigSearchResult = await pathConfigCollection.find({});
  await pathConfigSearchResult.forEach(info);

  process.exit(0);
};

seedDb();
