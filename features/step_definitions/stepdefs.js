const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then } = require("cucumber");

const sendRequest = async body => {
  const res = await fetch(
    "https://dev-register-a-food-business-service-double.azurewebsites.net//api/registration/createNewRegistration",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  return res.json();
};

const getRequest = async id => {
  const res = await fetch(
    `https://dev-register-a-food-business-service-double.azurewebsites.net//api/registration/${id}`
  );
  return res.json();
};
Given("I enter an email address without an @ symbol", function() {
  this.emailAddress = "skdjfh";
});

When("I submit the email to the back end application", async function() {
  const requestBody = JSON.stringify({
    query: `mutation { createEstablishment(id: 1, operator_email: "${
      this.emailAddress
    }") {id} }`
  });
  this.response = await sendRequest(requestBody);
});

Then("I get an email error response", function() {
  assert.equal(this.response.errors[0].message, "The request is invalid.");
  assert.equal(this.response.errors[0].state.email, "Invalid email address");
});

Then("I get an invalid phone number response", function() {
  assert.equal(this.response.errors[0].message, "The request is invalid.");
  this.response.errors[0].state.operator_mobile_numbers.forEach(err => {
    assert.equal(err, "Invalid phone number");
  });
});

Then("I get multiple invalid phone number responses", function() {
  this.response.errors[0].state.operator_mobile_numbers.forEach(err => {
    assert.equal(err, "Invalid phone number");
  });
});

Given("I enter an email address with two @ symbols", function() {
  this.emailAddress = "testing@twosymbols@test";
});

Given("I enter a mobile number longer than 11 digits long", function() {
  this.mobileNumber = ["01234567890123"];
});

Given("I enter multiple phone numbers longer than 11 digits long", function() {
  this.mobileNumber = ["012345678938764", "01233129378329934243"];
});

When(
  "I submit the mobile number to the back end application",
  async function() {
    const requestBody = JSON.stringify({
      query: `mutation { createEstablishment(id: 1, operator_mobile_numbers: "${
        this.mobileNumber
      }") {id} }`
    });
    this.response = await sendRequest(requestBody);
  }
);

Then("I get an error response for mobile", function() {
  assert.equal(this.response.errors[0].message, "invalid mobile sent");
});

Given(
  "I enter a mobile number exactly 11 characters long including spaces, but with less than 11 digits",
  function() {
    this.mobileNumber = ["012345 6789"];
  }
);

When(
  "I submit the mobile number that includes a space to the back end application",
  async function() {
    const requestBody = JSON.stringify({
      query: `mutation { createEstablishment(id: 1, operator_mobile_numbers: "${
        this.mobileNumber
      }") {id} }`
    });
    this.response = await sendRequest(requestBody);
  }
);

Then("I get an error response for mobile due to the space", function() {
  assert.equal(this.response.errors[0].message, "invalid mobile sent");
});

//////////////

Given("I have a new registration with all valid required fields", function() {
  this.registration = {
    registration: {
      establishment: {
        establishment_details: {
          establishment_trading_name: "Itsu",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "django@email.com",
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
          operator_email: "operator@email.com",
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
          business_type: "Livestock farm"
        }
      },
      metadata: {
        declaration1: "Declaration",
        declaration2: "Declaration",
        declaration3: "Declaration"
      }
    }
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
            operator_email: "operator@email.com",
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
            customer_type: "End consumer"
          }
        },
        metadata: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      }
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
  assert.ok(this.response.error);
});

Then("The non personal information is saved to the database", async function() {
  const id = this.response.regId;
  this.response = await getRequest(id);
  assert.equal(this.response.establishment.establishment_trading_name, "Itsu");
});

Then("The personal information is not saved to the database", async function() {
  const id = this.response.regId;
  this.response = await getRequest(id);
  assert.equal(this.response.establishment.operator_first_name, null);
});

Then("I receive a confirmation number", async function() {
  assert.ok(this.response["fsa-rn"]);
});
