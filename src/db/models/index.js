const { activities } = require("./Activities.js");
const { establishment } = require("./Establishment");
const { metadata } = require("./Metadata");
const { operator } = require("./Operator");
const { premise } = require("./Premise");
const { registration } = require("./Registration");
const { setupRelationships } = require("./relationships");

module.exports = {
  activities,
  establishment,
  metadata,
  operator,
  premise,
  registration,
  setupRelationships
};
