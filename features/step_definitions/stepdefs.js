const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then } = require("cucumber");

const sendRequest = async body => {
  const res = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body
  });

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
