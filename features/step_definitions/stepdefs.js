const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then, setDefaultTimeout } = require("cucumber");
const {
  FRONT_END_NAME,
  FRONT_END_SECRET,
  ADMIN_NAME,
  ADMIN_SECRET
} = require("../../src/config");

setDefaultTimeout(60 * 1000);

const sendRequest = async body => {
  const headers = {
    "Content-Type": "application/json",
    "api-secret": FRONT_END_SECRET,
    "client-name": FRONT_END_NAME
  };
  const res = await fetch(
    "http://dev-register-a-food-business-service.azurewebsites.net/api/registration/createNewRegistration",
    {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    }
  );

  return res.json();
};

const getRequest = async id => {
  const headers = {
    "Content-Type": "application/json",
    "api-secret": ADMIN_SECRET,
    "client-name": ADMIN_NAME
  };
  const res = await fetch(
    `http://dev-register-a-food-business-service.azurewebsites.net/api/registration/${id}`,
    {
      headers
    }
  );
  return res.json();
};
////////

Given("I have a new registration with all valid required fields", function() {
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
          operator_first_line: "335",
          operator_street: "Some St.",
          operator_town: "London",
          operator_primary_number: "9827235",
          operator_email: "fsatestemail.valid@gmail.com",
          operator_type: "Sole trader"
        },
        premise: {
          establishment_postcode: "SW12 9RQ",
          establishment_first_line: "123",
          establishment_street: "Street",
          establishment_town: "London",
          establishment_type: "domestic"
        },
        activities: {
          customer_type: "End consumer",
          business_type: "Livestock farm",
          import_export_activities: "None",
          business_other_details: "Food business",
          opening_days_irregular: "Open christmas",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true
        }
      },
      metadata: {
        declaration1: "Declaration",
        declaration2: "Declaration",
        declaration3: "Declaration"
      }
    },
    local_council_url: "cardiff"
  };
});

Given(
  "I have a new establishment with some invalid required fields",
  function() {
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
            operator_first_line: "335",
            operator_street: "Some St.",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "fsatestemail.valid@gmail.com",
            operator_type: "Sole trader"
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_first_line: "123",
            establishment_street: "Street",
            establishment_town: "London",
            establishment_type: "domestic"
          },
          activities: {
            customer_type: "End consumer",
            opening_day_monday: "true"
          }
        },
        metadata: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      },
      local_council_url: "cardiff"
    };
  }
);
Given("I have multiple conditional required fields", function() {
  this.registration.registration.establishment.operator.operator_charity_name =
    "Op Charity Name";
});

When("I submit it to the backend", async function() {
  this.response = await sendRequest(this.registration);
});

When("I submit my multiple fields to the backend", async function() {
  const requestBody = JSON.stringify({
    query: `mutation { createEstablishment(id: 1, 
    operator_email: "${this.operator_email}", 
    operator_type: "${this.operator_type}",
    operator_primary_number: "${this.operator_primary_number}", 
    operator_postcode: "${this.operator_postcode}", 
    operator_first_line: "${this.operator_first_line}", 
    establishment_trading_name: "${this.establishment_trading_name}", 
    establishment_postcode: "${this.establishment_postcode}", 
    establishment_first_line: "${this.establishment_first_line}",
    establishment_primary_number: "${this.establishment_primary_number}", 
    establishment_email: "${this.establishment_email}", 
    establishment_type: "${this.establishment_type}", 
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

Then("I get a success response", function() {
  assert.ok(this.response.regId);
});

Then("I get an error response", function() {
  assert.ok(this.response.errorCode);
});

Then("The non personal information is saved to the database", async function() {
  const id = this.response["fsa-rn"];
  this.response = await getRequest(id);

  assert.equal(this.response.establishment.establishment_trading_name, "Itsu");
});

Then("The personal information is not saved to the database", async function() {
  const id = this.response["fsa-rn"];
  this.response = await getRequest(id);
  assert.equal(this.response.establishment.operator_first_name, null);
});

Then("I receive a confirmation number", async function() {
  assert.ok(this.response["fsa-rn"]);
});
