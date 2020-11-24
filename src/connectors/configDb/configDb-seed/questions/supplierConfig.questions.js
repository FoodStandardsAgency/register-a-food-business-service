const supplier = [
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_SUPPLIER_NAME",
    message: "Enter the display name for the new supplier"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_SUPPLIER_ID",
    message: "Enter the ID/code for the new supplier, e.g. 1234"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_SUPPLIER_URL",
    message: "Enter the url string of the new supplier, e.g. tascomi"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_SUPPLIER_COUNCILS",
    message:
      "Enter the urls for the linked councils in comma separated list, e.g. bath,cardiff"
  }
];

module.exports = supplier;
