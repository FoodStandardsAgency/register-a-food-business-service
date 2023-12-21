const configVersion = [
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_CONFIG_VERSION_NUMBER",
    message: "Enter the new config version number, e.g. 1.0.0"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_NOTIFY_TEMPLATE_FBO",
    message: "Enter the FBO email Notify template ID associated with the config version number"
  },
  {
    env: ["dev", "test", "staging", "production"],
    type: "input",
    name: "SEED_NOTIFY_TEMPLATE_LC",
    message: "Enter the LC email Notify template ID associated with the config version number"
  }
];

module.exports = configVersion;
