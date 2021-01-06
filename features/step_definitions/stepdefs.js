const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then, setDefaultTimeout } = require("cucumber");
const {
  FRONT_END_NAME,
  FRONT_END_SECRET,
  DIRECT_API_NAME,
  DIRECT_API_SECRET,
  ADMIN_NAME,
  ADMIN_SECRET
} = require("../../src/config");

setDefaultTimeout(60 * 1000);

let apiUrl =
  "https://staging-register-a-food-business-service.azurewebsites.net";
if (process.env.NODE_ENV === "local") {
  apiUrl = process.env.API_URL ? process.env.API_URL : apiUrl;
}

const sendRequest = async (body) => {
  const headers = {
    "Content-Type": "application/json",
    "api-secret": FRONT_END_SECRET,
    "client-name": FRONT_END_NAME,
    "registration-data-version": "1.2.1"
  };
  const res = await fetch(`${apiUrl}/api/registration/createNewRegistration`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  return res.json();
};

const sendDirectRequest = async (body) => {
  const headers = {
    "Content-Type": "application/json",
    "api-secret": DIRECT_API_SECRET,
    "client-name": DIRECT_API_NAME,
    "registration-data-version": "1.2.1"
  };
  const res = await fetch(`${apiUrl}/api/registration/v1/createNewDirectRegistration/cardiff`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  return res.json();
};

const getRequest = async (id) => {
  const headers = {
    "Content-Type": "application/json",
    "api-secret": ADMIN_SECRET,
    "client-name": ADMIN_NAME
  };
  const res = await fetch(`${apiUrl}/api/registration/${id}`, {
    headers
  });
  return res.json();
};
////////

Given("I have a new registration with all valid required fields", function () {
  this.registration = {
    registration: {
      establishment: {
        establishment_details: {
          establishment_trading_name: "Itsu",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "fsatestemail.valid@gmail.com",
          establishment_opening_date: "2018-06-07"
        },
        operator: {
          operator_first_name: "Fred",
          operator_last_name: "Bloggs",
          operator_postcode: "SW12 9RQ",
          operator_address_line_1: "335",
          operator_address_line_2: "Some St.",
          operator_address_line_3: "Locality",
          operator_town: "London",
          operator_primary_number: "9827235",
          operator_email: "fsatestemail.valid@gmail.com",
          operator_type: "SOLETRADER"
        },
        premise: {
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "DOMESTIC"
        },
        activities: {
          customer_type: "END_CONSUMER",
          business_type: "002",
          import_export_activities: "NONE",
          business_other_details: "Food business",
          opening_days_irregular: "Open christmas",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true,
          water_supply: "PUBLIC"
        }
      },
      declaration: {
        declaration1: "Declaration",
        declaration2: "Declaration",
        declaration3: "Declaration"
      }
    },
    local_council_url: "west-dorset"
  };
});

Given("I have a new direct submission registration with all valid required fields", function () {
  this.registration = {
      establishment: {
        establishment_trading_name: "Itsu",
        establishment_primary_number: "329857245",
        establishment_secondary_number: "84345245",
        establishment_email: "fsatestemail.valid@gmail.com",
        establishment_opening_date: "2018-06-07",
        operator: {
          operator_first_name: "Fred",
          operator_last_name: "Bloggs",
          operator_postcode: "SW12 9RQ",
          operator_address_line_1: "335",
          operator_address_line_2: "Some St.",
          operator_address_line_3: "Locality",
          operator_town: "London",
          operator_primary_number: "9827235",
          operator_email: "fsatestemail.valid@gmail.com",
          operator_type: "SOLETRADER"
        },
        premise: {
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "DOMESTIC"
        },
        activities: {
          customer_type: "END_CONSUMER",
          business_type: "002",
          import_export_activities: "NONE",
          business_other_details: "Food business",
          opening_days_irregular: "Open christmas",
          water_supply: "PUBLIC"
        }
      }
  };
});

Given(
  "I have a new establishment with some invalid required fields",
  function () {
    this.registration = {
      registration: {
        establishment: {
          establishment_details: {
            establishment_trading_name: "Itsu",
            establishment_primary_number: "349785766",
            establishment_secondary_number: "84345245",
            establishment_email: "dfg",
            establishment_opening_date: "2018-06-07"
          },
          operator: {
            operator_first_name: "Fred",
            operator_last_name: "Bloggs",
            operator_postcode: "SW12 9RQ",
            operator_address_line_1: "335",
            operator_address_line_2: "Some St.",
            operator_address_line_3: "Locality",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "Sole trader"
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locailty",
            establishment_town: "London",
            establishment_type: "domestic"
          },
          activities: {
            customer_type: "End consumer",
            opening_day_monday: "true",
            opening_hours_monday: "09:00 to 17:00",
            water_supply: "Public"
          }
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      },
      local_council_url: "west-dorset"
    };
  }
);
Given("I have multiple conditional required fields", function () {
  this.registration.registration.establishment.operator.operator_charity_name =
    "Op Charity Name";
});

When("I submit it to the backend", async function () {
  this.response = await sendRequest(this.registration);
});

When("I submit it to the direct backend API", async function () {
  this.response = await sendDirectRequest(this.registration);
});

When("I submit my multiple fields to the backend", async function () {
  const requestBody = JSON.stringify({
    query: `mutation { createEstablishment(id: 1, 
    operator_email: "${this.operator_email}", 
    operator_type: "${this.operator_type}",
    operator_primary_number: "${this.operator_primary_number}", 
    operator_postcode: "${this.operator_postcode}", 
    operator_address_line_1: "${this.operator_address_line_1}", 
    establishment_trading_name: "${this.establishment_trading_name}", 
    establishment_postcode: "${this.establishment_postcode}", 
    establishment_address_line_1: "${this.establishment_address_line_1}",
    establishment_primary_number: "${this.establishment_primary_number}", 
    establishment_email: "${this.establishment_email}", 
    establishment_type: "${this.establishment_type}", 
    water_supply: "${this.water_supply}",
    declaration1: "${this.declaration1}",  
    declaration2: "${this.declaration2}", 
    declaration3: "${this.declaration3}", 
    operator_first_name: "${this.operator_first_name}", 
    operator_last_name: "${this.operator_last_name}", 
    operator_charity_name: "${this.operator_charity_name}"
    
    ) {id, establishment_trading_name} }`
  });
  this.response = await sendRequest(requestBody);
});

Then("I get a success response", async function () {
  assert.ok(this.response["fsa-rn"]);
});

Then("I get an error response", async function () {
  assert.ok(this.response.userMessages);
});

Then(
  "The information is saved to the database",
  async function () {
    const id = this.response["fsa-rn"];
    getRequest(id).then((response) => () => {
      assert.equal(response.establishment.establishment_trading_name, "Itsu");
      assert.equal(response.establishment.operator.operator_first_name, "Fred");
    });
  }
);

Then("I receive a confirmation number", async function () {
  assert.ok(this.response["fsa-rn"]);
});
