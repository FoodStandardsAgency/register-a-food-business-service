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
    local_council_url: "bridgend",
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 8015,
    local_council: "City of Cardiff Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "0300 123 6696",
    local_council_url: "cardiff",
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 8002,
    local_council: "Vale of Glamorgan Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "0300 123 6696",
    local_council_url: "the-vale-of-glamorgan",
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 6008,
    local_council: "Mid & East Antrim Borough Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "mid-and-east-antrim",
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 4221,
    local_council: "West Dorset District Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "west-dorset",
    separate_standards_council: 4226,
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 4223,
    local_council: "North Dorset District Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "north-dorset",
    separate_standards_council: 4226,
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 4220,
    local_council: "Weymouth and Portland Borough Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "weymouth-and-portland",
    separate_standards_council: 4226,
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  },
  {
    _id: 4226,
    local_council: "Dorset County Council",
    local_council_email: "fsatestemail.valid@gmail.com",
    local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
    local_council_phone_number: "123456789",
    local_council_url: "",
    auth: {
      url: process.env.TASCOMI_URL,
      public_key: process.env.TASCOMI_PUBLIC_KEY,
      private_key: process.env.TASCOMI_PRIVATE_KEY
    }
  }
];

const pathConfigVersions = [
  {
    _id: "1.0.0",
    notify_template_keys: {
      fbo_submission_complete: process.env.NOTIFY_TEMPLATE_ID_FBO_100,
      lc_new_registration: process.env.NOTIFY_TEMPLATE_ID_LC_100
    },
    path: {
      "/index": {
        on: true,
        switches: {}
      },
      "/registration-role": {
        on: true,
        switches: {
          "Sole trader": {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          Partnership: {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          Representative: { "/operator-type": true }
        }
      },
      "/operator-type": {
        on: false,
        switches: {
          "A person": {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          "A company": {
            "/operator-company-details": true,
            "/contact-representative": true
          },
          "A charity": {
            "/operator-charity-details": true,
            "/contact-representative": true
          }
        }
      },
      "/operator-company-details": {
        on: false,
        switches: {}
      },
      "/operator-charity-details": {
        on: false,
        switches: {}
      },
      "/operator-name": {
        on: false,
        switches: {}
      },
      "/operator-address": {
        on: true,
        switches: {}
      },
      "/operator-address-select": {
        on: true,
        switches: {}
      },
      "/operator-address-manual": {
        on: false,
        switches: {
          operator_first_line: { "/operator-address-manual": true }
        }
      },
      "/operator-contact-details": {
        on: false,
        switches: {}
      },
      "/contact-representative": {
        on: false,
        switches: {}
      },
      "/establishment-trading-name": {
        on: true,
        switches: {}
      },
      "/establishment-address-type": {
        on: true,
        switches: {}
      },
      "/establishment-address": {
        on: true,
        switches: {}
      },
      "/establishment-address-select": {
        on: true,
        switches: {}
      },
      "/establishment-address-manual": {
        on: false,
        switches: {
          establishment_first_line: { "/establishment-address-manual": true }
        }
      },
      "/establishment-contact-details": {
        on: true,
        switches: {}
      },
      "/establishment-opening-status": {
        on: true,
        switches: {
          "Establishment is already trading": {
            "/establishment-opening-date-retroactive": true
          },
          "Establishment is not trading yet": {
            "/establishment-opening-date-proactive": true
          }
        }
      },
      "/establishment-opening-date-proactive": {
        on: false,
        switches: {}
      },
      "/establishment-opening-date-retroactive": {
        on: false,
        switches: {}
      },
      "/customer-type": {
        on: true,
        switches: {}
      },
      "/business-type": {
        on: true,
        switches: {}
      },
      "/business-import-export": {
        on: true,
        switches: {}
      },
      "/registration-summary": {
        on: true,
        switches: {}
      },
      "/declaration": {
        on: true,
        switches: {}
      }
    }
  },
  {
    _id: "1.1.0",
    notify_template_keys: {
      fbo_submission_complete: process.env.NOTIFY_TEMPLATE_ID_FBO_110,
      lc_new_registration: process.env.NOTIFY_TEMPLATE_ID_LC_110
    },
    path: {
      "/index": {
        on: true,
        switches: {}
      },
      "/registration-role": {
        on: true,
        switches: {
          "Sole trader": {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          Partnership: {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          Representative: { "/operator-type": true }
        }
      },
      "/operator-type": {
        on: false,
        switches: {
          "A person": {
            "/operator-name": true,
            "/operator-contact-details": true
          },
          "A company": {
            "/operator-company-details": true,
            "/contact-representative": true
          },
          "A charity": {
            "/operator-charity-details": true,
            "/contact-representative": true
          }
        }
      },
      "/operator-company-details": {
        on: false,
        switches: {}
      },
      "/operator-charity-details": {
        on: false,
        switches: {}
      },
      "/operator-name": {
        on: false,
        switches: {}
      },
      "/operator-address": {
        on: true,
        switches: {}
      },
      "/operator-address-select": {
        on: true,
        switches: {}
      },
      "/operator-address-manual": {
        on: false,
        switches: {
          operator_first_line: { "/operator-address-manual": true }
        }
      },
      "/operator-contact-details": {
        on: false,
        switches: {}
      },
      "/contact-representative": {
        on: false,
        switches: {}
      },
      "/establishment-trading-name": {
        on: true,
        switches: {}
      },
      "/establishment-address-type": {
        on: true,
        switches: {}
      },
      "/establishment-address": {
        on: true,
        switches: {}
      },
      "/establishment-address-select": {
        on: true,
        switches: {}
      },
      "/establishment-address-manual": {
        on: false,
        switches: {
          establishment_first_line: { "/establishment-address-manual": true }
        }
      },
      "/establishment-contact-details": {
        on: true,
        switches: {}
      },
      "/establishment-opening-status": {
        on: true,
        switches: {
          "Establishment is already trading": {
            "/establishment-opening-date-retroactive": true
          },
          "Establishment is not trading yet": {
            "/establishment-opening-date-proactive": true
          }
        }
      },
      "/establishment-opening-date-proactive": {
        on: false,
        switches: {}
      },
      "/establishment-opening-date-retroactive": {
        on: false,
        switches: {}
      },
      "/customer-type": {
        on: true,
        switches: {}
      },
      "/business-type": {
        on: true,
        switches: {}
      },
      "/business-import-export": {
        on: true,
        switches: {}
      },
      "/business-other-details": {
        on: true,
        switches: {}
      },
      "/registration-summary": {
        on: true,
        switches: {}
      },
      "/declaration": {
        on: true,
        switches: {}
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
  if (
    process.env.NOTIFY_TEMPLATE_ID_FBO_100 &&
    process.env.NOTIFY_TEMPLATE_ID_FBO_110 &&
    process.env.NOTIFY_TEMPLATE_ID_LC_100 &&
    process.env.NOTIFY_TEMPLATE_ID_LC_110
  ) {
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
  } else {
    throw new Error("Missing notify template IDs from .env");
  }
};

seedDb();
