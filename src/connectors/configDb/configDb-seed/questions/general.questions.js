const collectionQuestion = [
  {
    type: "list",
    name: "actions",
    message: "Which configDb collection would you like to seed a new entry to?",
    choices: ["configVersion", "localCouncil"]
  }
];

const envQuestions = [
  {
    type: "checkbox",
    name: "environments",
    message: "Which environments do you want to deploy to?",
    choices: [
      {
        name: "dev",
        checked: true
      },
      {
        name: "test",
        checked: true
      },
      {
        name: "staging",
        checked: true
      },
      {
        name: "production"
      }
    ],
    validate: answer =>
      answer.length < 1 ? "You must choose at least one environment" : true
  }
];

const envUrlQuestions = {
  dev: {
    type: "input",
    name: "config_db_url_dev",
    message: "Enter the DEV environment config db URL"
  },
  test: {
    type: "input",
    name: "config_db_url_test",
    message: "Enter the TEST environment config db URL"
  },
  staging: {
    type: "input",
    name: "config_db_url_staging",
    message: "Enter the STAGING environment config db URL"
  },
  production: {
    type: "input",
    name: "config_db_url_production",
    message: "Enter the PRODUCTION environment config db URL"
  }
};

module.exports = { collectionQuestion, envQuestions, envUrlQuestions };
