const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then } = require("cucumber");

const sendRequest = async body => {
  const res = await fetch(
    "https://register-a-food-business-service-dev.azurewebsites.net/graphql",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    }
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

Given("I have a new establishment with all valid required fields", function() {
  (this.operator_email = "valid@email.com"),
    (this.operatorType = "sole_trader"),
    (this.operator_primary_number = "07722343454"),
    (this.operator_postcode = "NW1 4HB"),
    (this.operator_first_line = "Operator Testing Line"),
    (this.establishment_trading_name = "Test Trading Name"),
    (this.establishment_postcode = "WC1H 8WK"),
    (this.establishment_first_line = "Establishment Testing Line"),
    (this.establishment_primary_number = "07722343545"),
    (this.establishment_email = "establishment@email.com"),
    (this.establishment_opening_date = "2018-06-04"),
    (this.customer_type = "Other businesses"),
    (this.declaration1 = "true"),
    (this.declaration2 = "true"),
    (this.declaration3 = "true"),
    (this.operator_first_name = "Tester"),
    (this.operator_last_name = "McTestface");
});

Given(
  "I have a new establishment with some invalid required fields",
  function() {
    (this.operator_email = "validemail.com"),
      (this.operatorType = "sole_trader"),
      (this.operator_primary_number = "§§§§§"),
      (this.operator_postcode = "NW1 4HB"),
      (this.operator_first_line = "Operator Testing Line"),
      (this.establishment_trading_name = ""),
      (this.establishment_postcode = "WC1H 8WK"),
      (this.establishment_first_line = "Establishment Testing Line"),
      (this.establishment_primary_number = "07722343545"),
      (this.establishment_email = "establishment@email.com"),
      (this.declaration1 = "true"),
      (this.declaration2 = "true"),
      (this.declaration3 = "true"),
      (this.operator_first_name = "Tester"),
      (this.operator_last_name = "McTestface");
  }
);
Given("I have multiple conditional required fields", function() {
  this.operator_charity_name = "Op Charity Name";
});

When("I submit it to the backend", async function() {
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
    establishment_opening_date: "${this.establishment_opening_date}",
    customer_type: "${this.customer_type}",
    declaration1: "${this.declaration1}",  
    declaration2: "${this.declaration2}", 
    declaration3: "${this.declaration3}", 
    operator_first_name: "${this.operator_first_name}", 
    operator_last_name: "${this.operator_last_name}", 
    
    ) {id, establishment_trading_name} }`
  });
  this.response = await sendRequest(requestBody);
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
  assert.equal(
    this.response.data.createEstablishment.establishment_trading_name,
    this.establishment_trading_name
  );
});

Then("I get an error response", function() {
  assert.equal(this.response.errors[0].message, "The request is invalid.");
});

Then("The non personal information is saved to the database", async function() {
  const requestBody = JSON.stringify({
    query: `query { establishment(id: "${
      this.response.data.createEstablishment.id
    }")
    {establishment_trading_name} }`
  });
  this.response = await sendRequest(requestBody);
  assert.equal(
    this.response.data.establishment.establishment_trading_name,
    "Test Trading Name"
  );
});

Then("The personal information is not saved to the database", async function() {
  const requestBody = JSON.stringify({
    query: `query { establishment(id: "${
      this.response.data.createEstablishment.id
    }")
    {establishment_trading_name} }`
  });
  this.response = await sendRequest(requestBody);
  assert.equal(this.response.data.establishment.operator_first_name, null);
});
