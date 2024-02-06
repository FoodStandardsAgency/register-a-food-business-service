const localCouncil = [
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_LC_NAME",
    message: "Enter the display name for the new local council"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_LC_ID",
    message: "Enter the four-digit numeric ID/code for the new local council, e.g. 1234"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_LC_URL",
    message: "Enter the url string of the new local council, e.g. west-dorset"
  },
  {
    env: ["production"],
    type: "input",
    name: "SEED_LC_EMAIL",
    message: "Enter the email address that the council wants displayed to users"
  },
  {
    env: ["production"],
    type: "input",
    name: "SEED_LC_NOTIFY_EMAIL",
    message: "Enter the email address that the council wants to be notified on"
  },
  {
    env: ["production"],
    type: "input",
    name: "SEED_LC_PHONE_NUMBER",
    message: "(OPTIONAL) Enter the phone number that the council wants displayed to users"
  }
];

module.exports = localCouncil;
