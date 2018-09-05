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
    local_council_phone_number: "123456789",
    local_council_url: "bridgend"
  },
  {
    _id: 8015,
    local_council: "City of Cardiff Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "cardiff"
  },
  {
    _id: 8002,
    local_council: "Vale of Glamorgan Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_url: "the-vale-of-glamorgan"
  }
  // {
  //   _id: 6008,
  //   local_council: "Mid & East Antrim Borough Council",
  //   local_council_email: "fsatestemail.valid@gmail.com,
  //   local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
  //   local_council_phone_number: "123456789",
  //   local_council_url: "mid-and-east-antrim"
  // },
  // {
  //   _id: 4221,
  //   local_council: "West Dorset District Council",
  //   local_council_email: "fsatestemail.valid@gmail.com",
  //   local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
  //   local_council_phone_number: "123456789",
  //   local_council_url: "west-dorset",
  //   separate_standards_council: 4226
  // },
  // {
  //   _id: 4223,
  //   local_council: "North Dorset District Council",
  //   local_council_email: "fsatestemail.valid@gmail.com",
  //   local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
  //   local_council_phone_number: "123456789",
  //   local_council_url: "north-dorset",
  //   separate_standards_council: 4226
  // },
  // {
  //   _id: 4220,
  //   local_council: "Weymouth and Portland Borough Council",
  //   local_council_email: "fsatestemail.valid@gmail.com",
  //   local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
  //   local_council_phone_number: "123456789",
  //   local_council_url: "weymouth-and-portland",
  //   separate_standards_council: 4226
  // },
  // {
  //   _id: 4226,
  //   local_council: "Dorset County Council",
  //   local_council_email: "fsatestemail.valid@gmail.com",
  //   local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
  //   local_council_phone_number: "123456789",
  //   local_council_url: ""
  // }
];

let client;
let configDB;
let lcConfigCollection;

const establishConnectionToMongo = async () => {
  client = await mongoClient.connect(CONFIGDB_URL, {
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
