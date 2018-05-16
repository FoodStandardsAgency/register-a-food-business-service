const assert = require('assert');
const fetch = require('node-fetch');
const { Given, When, Then } = require('cucumber');


const sendRequest = async (body) => {
  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });

  return res.json();
}
Given('I enter an email address without an @ symbol', function () {
  this.emailAddress = 'skdjfh';
});

When('I submit it to the back end application', async function () {
  const requestBody = JSON.stringify({ query: `mutation { createEstablishment(id: 1, operator_email: "${this.emailAddress}") {id} }`});
  this.response = await sendRequest(requestBody);
});

Then('I get an error response', function () {
  assert.equal(this.response.errors[0].message, 'invalid email address sent');
});