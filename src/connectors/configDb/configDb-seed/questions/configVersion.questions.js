const configVersionQuestions = {
  allEnvs: [
    {
      type: "input",
      name: "SEED_CONFIG_VERSION_NUMBER",
      message: "Enter the new config version number, e.g. 1.0.0"
    },
    {
      type: "input",
      name: "SEED_NOTIFY_TEMPLATE_FBO",
      message:
        "Enter the FBO email template ID associated with the config version number"
    },
    {
      type: "input",
      name: "SEED_NOTIFY_TEMPLATE_LC",
      message:
        "Enter the LC email template ID associated with the config version number"
    }
  ],
  nonProduction: [],
  production: []
};

module.exports = { configVersionQuestions };
