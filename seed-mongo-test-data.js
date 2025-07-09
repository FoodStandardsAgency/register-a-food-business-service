const { MongoClient, ObjectId } = require("mongodb");

async function seed() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();

    // CONFIG DB
    const configDb = client.db("config");

    // Seed localAuthorities
    await configDb.collection("localAuthorities").deleteMany({});
    await configDb.collection("localAuthorities").insertMany([
      {
        _id: 8015,
        local_council: "Fakes Council",
        local_council_email: "fakecouncil@test.com",
        local_council_notify_emails: ["LC1_fsatestemail.valid@gmail.com"],
        local_council_phone_number: "01234 456788",
        local_council_url: "fakes",
        country: "england"
      },
      {
        _id: 4226,
        local_council: "Dorset County Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "123456789",
        local_council_url: "",
        country: "england",
        auth: null,
        mapit_id: 152225,
        mapit_generation: 34
      },
      {
        _id: 4221,
        local_council: "West Dorset District Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        separate_standards_council: 4226,
        local_council_notify_emails: ["LC1_fsatestemail.valid@gmail.com"],
        local_council_phone_number: "02388 899766",
        local_council_url: "west-dorset",
        country: "england",
        auth: null,
        mapit_id: 2293,
        new_authority_id: 4226,
        new_authority_name: "Dorset Council"
      },
      {
        _id: 4104,
        local_council: "Lincolnshire County Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "",
        local_council_url: "",
        country: "england",
        auth: null,
        mapit_id: 2232
      },
      {
        _id: 4099,
        local_council: "South Holland District Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "01775 761161",
        local_council_url: "south-holland",
        separate_standards_council: 4104,
        country: "england",
        auth: null,
        mapit_id: 2381
      },
      {
        _id: 4308,
        local_council: "North Somerset Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "01934 888888",
        local_council_url: "north-somerset",
        country: "england",
        auth: null,
        mapit_id: 2642
      },
      {
        _id: 4012,
        local_council: "Fakes cardiff council",
        local_council_email: "fakecouncilcardiff@test.com",
        local_council_notify_emails: ["LC1_fsatestemail.validcardiff@gmail.com"],
        local_council_phone_number: "01233 333445",
        local_council_url: "cardiff",
        country: "england",
        auth: null,
        mapit_id: 2639
      },
      {
        _id: 4013,
        local_council: "Fakes vale of G council",
        local_council_email: "fakecouncilvog@test.com",
        local_council_notify_emails: ["LC1_fsatestemail.validvog@gmail.com"],
        local_council_phone_number: "01233 333445",
        local_council_url: "the-vale-of-glamorgan",
        country: "wales",
        auth: null,
        mapit_id: 2557
      },
      {
        _id: 6008,
        local_council: "Mid & East Antrim Borough Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "123456789",
        local_council_url: "mid-and-east-antrim",
        country: "northern-ireland",
        auth: null,
        mapit_id: 145962
      },
      {
        _id: 6010,
        local_council: "Newry, Mourne and Down District Council",
        local_council_email: "fsatestemail.valid@gmail.com",
        local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
        local_council_phone_number: "123456789",
        local_council_url: "newry-mourne-and-down",
        country: "northern-ireland",
        auth: null,
        mapit_id: 145964
      },
      {
        _id: 100007,
        local_council: "Castle Point Borough Council",
        reg_form_url:
          "https://www.gov.uk/apply-for-a-licence/food-premises-registration/castle-point/apply-1",
        local_council_url: "la7",
        mapit_id: 2320
      }
    ]);
    console.log("localAuthorities seeded");

    // Seed suppliers
    await configDb.collection("suppliers").deleteMany({});
    await configDb.collection("suppliers").insertOne({
      _id: 1,
      supplier_name: "Test Supplier",
      supplier_url: "test-supplier",
      local_council_urls: ["cardiff", "bath"]
    });
    console.log("suppliers seeded");

    // REGISTRATIONS DB
    const regDb = client.db("registrations");

    // Seed registrations (sample data)
    await regDb.collection("registrations").deleteMany({});
    await regDb.collection("registrations").insertMany([
      {
        "fsa-rn": "0004-EMAILS-NS-TASCOMI-FAIL1",
        collected: true,
        collected_at: new Date("2020-02-09"),
        reg_submission_date: new Date("2020-02-09"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed Tascomi 1",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Jeff",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          tascomi: {
            time: "3/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0004-EMAILS-NS-TASCOMI-FAIL2",
        collected: true,
        collected_at: new Date("2020-02-10"),
        reg_submission_date: new Date("2020-02-10"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed tascomi 2",
            establishment_primary_number: "2222 2222222",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Sammy",
            operator_last_name: "Smith",
            operator_postcode: "GO18 7PZ",
            operator_town: "London",
            operator_address_line_1: "Test 2 Ltd",
            operator_address_line_2: "2 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "GU18 7JJ",
            establishment_town: "London",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          tascomi: {
            time: "3/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0004-EMAILS-FAILEDNOTIFICATIONS1",
        collected: true,
        collected_at: new Date("2020-02-14"),
        reg_submission_date: new Date("2020-02-14"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed notifications 1",
            establishment_primary_number: "09999 999999",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-02"
          },
          operator: {
            operator_first_name: "Roger",
            operator_last_name: "Beaney",
            operator_postcode: "SO15 7HH",
            operator_town: "Southampton",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "SO15 7HH",
            establishment_town: "Southampton",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          notifications: [
            {
              time: new Date("1/9/2020, 22:18:05"),
              sent: false,
              type: "LC",
              address: "LC0_fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("1/9/2020, 22:18:05"),
              sent: false,
              type: "FBO",
              address: "LC0_fsatestemail.valid@gmail.com"
            }
          ]
        }
      },
      {
        "fsa-rn": "0004-EMAILS-FAILEDNOTIFICATIONS2",
        collected: true,
        collected_at: new Date("2020-02-14"),
        reg_submission_date: new Date("2020-02-14"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed notifications 2",
            establishment_primary_number: "09999 999999",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-02"
          },
          operator: {
            operator_first_name: "Jimmy",
            operator_last_name: "Beaney",
            operator_postcode: "SO15 8JH",
            operator_town: "Southampton",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "SO15 7HH",
            establishment_town: "Southampton",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          notifications: []
        }
      },
      {
        "fsa-rn": "0004-EMAILS-NOSTATUS",
        collected: true,
        collected_at: new Date("2020-02-14"),
        reg_submission_date: new Date("2020-02-14"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Recent registration 999",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-22"
          },
          operator: {
            operator_first_name: "Simon",
            operator_last_name: "Smith",
            operator_postcode: "BH77 6HH",
            operator_town: "Bournemouth",
            operator_address_line_1: "Sunny Sands burger bar",
            operator_address_line_2: "Sandbanks beach",
            operator_address_line_3: "Bournemouth",
            operator_primary_number: "01788 333445",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "BH12 2FF",
            establishment_town: "Bournemouth",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Sunny sands burger bar",
            establishment_address_line_2: "Sandbanks beach",
            establishment_address_line_3: "Bournemouth"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {}
      },
      {
        "fsa-rn": "0004-EMAILS-FAILEDNOTIFICATIONS3",
        collected: true,
        collected_at: new Date("2020-02-09"),
        reg_submission_date: new Date("2020-02-09"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed notifications 3",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Sharon",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          notifications: [
            {
              time: new Date("1/9/2020, 22:18:05"),
              sent: false,
              type: "LC",
              address: "LC0_fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("1/9/2020, 22:18:05"),
              sent: false,
              type: "FBO",
              address: "LC0_fsatestemail.valid@gmail.com"
            }
          ],
          registration: {
            time: new Date("2/9/2020, 22:18:03"),
            complete: false
          },
          tascomi: {
            time: new Date("3/9/2020, 22:18:03"),
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0004-EMAILS-NOFAILEDSTATUSES",
        collected: true,
        collected_at: new Date("2020-02-15"),
        reg_submission_date: new Date("2020-02-15"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Its all good ltd",
            establishment_primary_number: "01677 089987",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-14"
          },
          operator: {
            operator_first_name: "All",
            operator_last_name: "Good",
            operator_postcode: "SO16 4DD",
            operator_town: "Southampton",
            operator_address_line_1: "All good Ltd",
            operator_address_line_2: "1 All Good Road",
            operator_address_line_3: "Southampton",
            operator_primary_number: "07888 766566",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            contact_representative_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "SO16 4DD",
            establishment_town: "Southampton",
            establishment_type: "MOBILE",
            establishment_address_line_1: "All good Ltd Premises",
            establishment_address_line_2: "444 Happy Lane",
            establishment_address_line_3: "Happyland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          feedback1: true,
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: [
            "LC0_fsatestemail.valid@gmail.com",
            "LC1_fsatestemail.valid@gmail.com"
          ],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          notifications: [
            {
              time: new Date("2/9/2020, 22:18:05"),
              sent: true,
              type: "LC",
              address: "LC0_fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("2/9/2020, 22:18:05"),
              sent: true,
              type: "LC",
              address: "LC1_fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("2/9/2020, 22:18:06"),
              sent: true,
              type: "FBO",
              address: "fdgdfgdgdf@fhghfghfhf.con"
            },
            {
              time: new Date("2/9/2020, 22:18:06"),
              sent: true,
              type: "FBO_FB",
              address: "fdgdfgdgdf@fhghfghfhf.con"
            },
            {
              time: new Date("2/9/2020, 22:18:06"),
              sent: true,
              type: "FD_FB",
              address: "fdgdfgdgdf@fhghfghfhf.con"
            }
          ],
          tascomi: {
            time: "3/9/2020, 22:18:03",
            complete: true
          }
        }
      },
      {
        "fsa-rn": "0101-FAILED-REG1",
        collected: true,
        collected_at: new Date("2020-02-12"),
        reg_submission_date: new Date("2020-02-12"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed Registration 1",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Jimbo",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: ["LC0_fsatestemail.valid@gmail.com"],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          registration: {
            time: "2/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0101-FAILED-REG2",
        collected: true,
        collected_at: new Date("2020-02-09"),
        reg_submission_date: new Date("2020-02-09"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed registration 2",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Sammy",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: ["LC0_fsatestemail.valid@gmail.com"],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          registration: {
            time: "2/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0101-FAILED-REG3",
        collected: true,
        collected_at: new Date("2020-02-09"),
        reg_submission_date: new Date("2020-02-09"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed registration 3",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "Sammy",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: ["LC0_fsatestemail.valid@gmail.com"],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          registration: {
            time: "2/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        "fsa-rn": "0101-NULL-NOTI-STAT",
        collected: true,
        collected_at: new Date("2020-02-09"),
        reg_submission_date: new Date("2020-02-09"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Failed registration 4",
            establishment_primary_number: "01234 456789",
            establishment_secondary_number: "",
            establishment_email: "EE_fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "John",
            operator_last_name: "Healey",
            operator_postcode: "NR14 7PZ",
            operator_town: "Norwich",
            operator_address_line_1: "Test 1 Ltd",
            operator_address_line_2: "1 Test Lane",
            operator_address_line_3: "Testland",
            operator_primary_number: "01234 567890",
            operator_secondary_number: "",
            operator_email: "FBO_fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "NR14 7PZ",
            establishment_town: "Norwich",
            establishment_type: "MOBILE",
            establishment_address_line_1: "Test 2 Ltd",
            establishment_address_line_2: "2 Test Lane",
            establishment_address_line_3: "Testland"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "053",
            business_type_search_term: "Casino",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "gdsgs",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "ddfg"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Test Council",
          local_council_notify_emails: ["LC0_fsatestemail.valid@gmail.com"],
          local_council_email: "LC_fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 123 456"
        },
        status: {
          notifications: null,
          registration: {
            time: "2/9/2020, 22:18:03",
            complete: false
          }
        }
      },
      {
        _id: ObjectId("5dca72519315020042c8e345"),
        "fsa-rn": "K9ZLSA-78MVM6-W4LPF1",
        collected: true,
        collected_at: new Date("2021-01-01"),
        reg_submission_date: new Date("2021-01-01"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "sssssssssobdsdsdsdsd",
            establishment_primary_number: "345435345435",
            establishment_secondary_number: "",
            establishment_email: "fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "fgvcvbnhn",
            operator_last_name: "dfdgf",
            operator_postcode: "BA1 5LR",
            operator_address_line_1: "Eveleigh House",
            operator_address_line_2: "Grove Street",
            operator_town: "Bath",
            operator_primary_number: "345435345435",
            operator_secondary_number: "",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER",
            operator_uprn: "100121172378"
          },
          premise: {
            establishment_postcode: "BA1 6QE",
            establishment_address_line_1: "7A",
            establishment_address_line_2: "Lambridge Mews",
            establishment_town: "Bath",
            establishment_type: "MOBILE",
            establishment_uprn: "10001141070"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "012",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "",
            opening_day_monday: true,
            opening_day_tuesday: true,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "fsdfds",
            opening_hours_tuesday: "sdfs"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment.",
          feedback1: "I agree to be contacted to provide feedback to help develop this service"
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Fakes Council",
          local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
          local_council_email: "fsatestemail.valid@gmail.com",
          local_council_phone_number: "0300 123 6696"
        },
        status: {
          registration: {
            time: "4/2/2020, 11:34:11",
            complete: true
          },
          notifications: [
            {
              time: new Date("11/12/2019, 08:50:27"),
              sent: true,
              type: "LC",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 08:50:27"),
              sent: true,
              type: "FBO",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 08:50:27"),
              sent: true,
              type: "FBO_FB",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 08:50:28"),
              sent: true,
              type: "FD_FB",
              address: "fsatestemail.valid@gmail.com"
            }
          ],
          tascomi: {
            time: "4/2/2020, 11:24:48",
            complete: true
          }
        },
        hygiene_council_code: 8015,
        local_council_url: "fakes",
        source_council_id: 8015,
        registration_data_version: "2.2.0"
      },
      {
        _id: ObjectId("5dca867622ebd10042c84caa"),
        "fsa-rn": "A1D3X4-6FCTGC-5WEJQQ",
        collected: true,
        collected_at: new Date("2021-01-01"),
        reg_submission_date: new Date("2021-01-01"),
        direct_submission: true,
        submission_language: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "pfffffff",
            establishment_primary_number: "01235645987",
            establishment_secondary_number: "",
            establishment_email: "fsatestemail.valid@gmail.com",
            establishment_opening_date: "2020-1-1"
          },
          operator: {
            operator_first_name: "Luke",
            operator_last_name: "Vincent",
            operator_postcode: "SN14 0TN",
            operator_address_line_1: "6",
            operator_address_line_2: "Moss Mead",
            operator_address_line_3: "Locality",
            operator_town: "Chippenham",
            operator_primary_number: "01235645987",
            operator_secondary_number: "",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER",
            operator_uprn: "17448021"
          },
          premise: {
            establishment_postcode: "SN14 0TN",
            establishment_address_line_1: "6",
            establishment_address_line_2: "Moss Mead",
            establishment_town: "Chippenham",
            establishment_address_line_3: "Locality",
            establishment_type: "MOBILE",
            establishment_uprn: "17448021"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "055",
            business_type_search_term: "Cafeteria",
            import_export_activities: "NONE",
            water_supply: "BOTH",
            business_other_details: "",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "786"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment.",
          feedback1: "I agree for this"
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Fakes Council",
          local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
          local_council_email: "fsatestemail.valid@gmail.com",
          local_council_phone_number: "0300 123 6696"
        },
        status: {
          registration: {
            time: "4/2/2020, 11:34:11",
            complete: true
          },
          notifications: [
            {
              time: new Date("4/2/2020, 11:24:43"),
              sent: true,
              type: "LC",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("4/2/2020, 11:24:43"),
              sent: true,
              type: "FBO",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("4/2/2020, 11:24:44"),
              sent: true,
              type: "FBO_FB",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("4/2/2020, 11:24:44"),
              sent: true,
              type: "FD_FB",
              address: "fsatestemail.valid@gmail.com"
            }
          ],
          tascomi: {
            time: "4/2/2020, 11:24:50",
            complete: true
          }
        },
        hygiene_council_code: 8015,
        local_council_url: "fakes",
        source_council_id: 8015,
        registration_data_version: "2.2.0"
      },
      {
        _id: ObjectId("5dcaa65fa24e940041d684bd"),
        "fsa-rn": "E9S2RC-ED2PJ2-BXY9BA",
        collected: false,
        collected_at: null,
        reg_submission_date: new Date("2021-01-01"),
        direct_submission: false,
        submission_language: "cy",
        establishment: {
          establishment_details: {
            establishment_trading_name: "cafecafe",
            establishment_primary_number: "9999999999999999",
            establishment_secondary_number: "",
            establishment_email: "fsatestemail.valid@gmail.com",
            establishment_opening_date: "2000-01-01"
          },
          operator: {
            operator_first_name: "qqqqqqqqqqqqqqqqq",
            operator_last_name: "aaaaaaaaaaaaaa",
            operator_postcode: "CB6 1PH",
            operator_address_line_1: "7A",
            operator_address_line_2: "Main Street",
            operator_town: "Ely",
            operator_address_line_3: "Littleport",
            operator_primary_number: "9999999999999999",
            operator_secondary_number: "",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER",
            operator_uprn: "100090049305"
          },
          premise: {
            establishment_postcode: "BA1 6EW",
            establishment_address_line_1: "7",
            establishment_address_line_2: "Eastbourne Avenue",
            establishment_town: "Bath",
            establishment_type: "MOBILE",
            establishment_uprn: "10001124901"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "055",
            business_type_search_term: "Cafeteria",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "9999999999999"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment.",
          feedback1: "I agree to be contacted to provide feedback to help develop this service"
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Fakes Council",
          local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
          local_council_email: "fsatestemail.valid@gmail.com",
          local_council_phone_number: "0300 123 6696"
        },
        status: {
          registration: {
            time: "4/2/2020, 11:34:12",
            complete: true
          },
          notifications: [
            {
              time: new Date("11/12/2019, 12:32:33"),
              sent: false,
              type: "LC",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:32:33"),
              sent: true,
              type: "FBO",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:32:33"),
              sent: true,
              type: "FBO_FB",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:32:34"),
              sent: true,
              type: "FD_FB",
              address: "fsatestemail.valid@gmail.com"
            }
          ],
          tascomi: {
            time: "11/12/2019, 12:32:33",
            complete: true
          }
        },
        hygiene_council_code: 8015,
        local_council_url: "fakes",
        source_council_id: 8015,
        registration_data_version: "2.2.0"
      },
      {
        _id: ObjectId("5dcaa787a24e940041d684be"),
        "fsa-rn": "CTA4VV-BR5N6H-SS73C2",
        collected: false,
        collected_at: null,
        reg_submission_date: new Date("2021-01-01"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "nonono",
            establishment_primary_number: "666666666666",
            establishment_secondary_number: "",
            establishment_email: "fsatestemail.valid@gmail.com",
            establishment_opening_date: "2001-01-01"
          },
          operator: {
            operator_first_name: "ppppppppppp",
            operator_last_name: "llllllllllllll",
            operator_postcode: "BA1 6EF",
            operator_address_line_1: "1A",
            operator_address_line_2: "Arundel Road",
            operator_town: "Bath",
            operator_primary_number: "666666666666",
            operator_secondary_number: "",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER",
            operator_uprn: "10023109760"
          },
          premise: {
            establishment_postcode: "CB6 1PH",
            establishment_address_line_1: "The Barn",
            establishment_address_line_2: "Main Street",
            establishment_town: "Littleport",
            establishment_type: "MOBILE",
            establishment_uprn: "10002598122"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "055",
            business_type_search_term: "Cafeteria",
            import_export_activities: "NONE",
            water_supply: "PRIVATE",
            business_other_details: "",
            opening_day_monday: true,
            opening_day_tuesday: false,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_monday: "vbnvbnv"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment.",
          feedback1: "I agree to be contacted to provide feedback to help develop this service"
        },
        hygieneAndStandards: {
          code: 8015,
          local_council: "Fakes cardiff council",
          local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
          local_council_email: "fsatestemail.valid@gmail.com",
          local_council_phone_number: "0300 123 6696"
        },
        status: {
          registration: {
            time: "4/2/2020, 11:34:13",
            complete: true
          },
          notifications: [
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: false,
              type: "LC",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FBO",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FBO_FB",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FD_FB",
              address: "fsatestemail.valid@gmail.com"
            }
          ],
          tascomi: {
            time: "11/12/2019, 12:32:33",
            complete: true
          }
        },
        hygiene_council_code: 4221,
        local_council_url: "cardiff",
        source_council_id: 4221,
        registration_data_version: "2.2.0"
      },
      {
        _id: ObjectId("5dcaa838a24e940041d684bf"),
        "fsa-rn": "PT07JA-VTZ577-ZDMAVZ",
        collected: true,
        collected_at: new Date("2021-01-01"),
        reg_submission_date: new Date("2021-01-01"),
        direct_submission: false,
        submission_langage: "en",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Partners Co",
            establishment_primary_number: "01111111111111",
            establishment_secondary_number: "",
            establishment_email: "fsatestemail.valid@gmail.com",
            establishment_opening_date: "2019-12-22"
          },
          operator: {
            operator_first_name: "Test",
            operator_last_name: "Trader",
            operator_postcode: "DN10 6XB",
            operator_address_line_1: "Carrilon UK",
            operator_primary_number: "01111111111111",
            operator_secondary_number: "",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "SOLETRADER",
            operator_uprn: "10023263307"
          },
          premise: {
            establishment_postcode: "DN10 6XB",
            establishment_address_line_1: "Carrilon UK",
            establishment_type: "MOBILE",
            establishment_uprn: "10023263307"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "017",
            business_type_search_term: "Jam",
            import_export_activities: "NONE",
            water_supply: "BOTH",
            business_other_details: "",
            opening_day_monday: false,
            opening_day_tuesday: true,
            opening_day_wednesday: false,
            opening_day_thursday: false,
            opening_day_friday: false,
            opening_day_saturday: false,
            opening_day_sunday: false,
            opening_hours_tuesday: "10:00 - 12:00"
          }
        },
        declaration: {
          declaration1:
            "I declare that the information I have given on this form is correct and complete to the best of my knowledge and belief.",
          declaration2:
            "I, or the operator, will notify food authorities of any significant changes to the business activity, including closure, within 28 days of the change happening.",
          declaration3:
            "I, or the operator, understands the operator is legally responsible for the safety and authenticity of the food being produced or served at this establishment."
        },
        hygieneAndStandards: {
          code: 4003,
          local_council: "City of London",
          local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
          local_council_email: "fsatestemail.valid@gmail.com",
          local_council_phone_number: "01234 567890"
        },
        status: {
          registration: {
            time: "11/12/2019, 12:40:26",
            complete: true
          },
          notifications: [
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "LC",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FBO",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FBO_FB",
              address: "fsatestemail.valid@gmail.com"
            },
            {
              time: new Date("11/12/2019, 12:37:28"),
              sent: true,
              type: "FD_FB",
              address: "fsatestemail.valid@gmail.com"
            }
          ],
          tascomi: {
            time: "11/12/2019, 12:32:33",
            complete: true
          }
        },
        hygiene_council_code: 4003,
        local_council_url: "city-of-london",
        source_council_id: 4003,
        registration_data_version: "2.2.0"
      }
    ]);

    // FRONT-END-CACHE DB
    const cacheDb = client.db("front-end-cache");

    console.log("All seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
