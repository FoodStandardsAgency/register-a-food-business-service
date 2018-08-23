const mongoClient = require("mongodb").MongoClient;
const { CONFIGDB_URL } = require("../../config");
const { info } = require("winston");

const arrayToInsert = [
  {
    // IDs are from https://data.food.gov.uk/codes/reference-number/_authority
    _id: 6008,
    lcName: "Mid & East Antrim Borough Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: ""
  },
  {
    _id: 8020,
    lcName: "Bridgend County Borough Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: ""
  },
  {
    _id: 4221,
    lcName: "West Dorset District Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: "",
    separateStandardsCouncil: 4226
  },
  {
    _id: 4223,
    lcName: "North Dorset District Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: "",
    separateStandardsCouncil: 4226
  },
  {
    _id: 4220,
    lcName: "Weymouth and Portland Borough Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: "",
    separateStandardsCouncil: 4226
  },
  {
    _id: 4226,
    lcName: "Dorset County Council",
    lcNotificationEmails: [],
    lcContactEmail: "fsatestemail.valid@gmail.com",
    urlString: ""
  }
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
