const collectionQuestion = [
  {
    type: "list",
    name: "collectionName",
    message: "Which configDb collection would you like to seed a new entry to?",
    choices: ["configVersion", "lcConfig"]
  }
];

const envQuestions = [
  {
    type: "checkbox",
    name: "environments",
    message:
      "Which environments do you want to deploy to? (Use the space bar to select and deselect)",
    choices: ["dev", "test", "staging", "production"],
    validate: (answer) =>
      answer.length < 1 ? "You must choose at least one environment" : true
  }
];

const envUrlQuestions = [
  {
    env: "dev",
    type: "input",
    name: "dev",
    message: "Enter the DEV environment config db URL"
  },
  {
    env: "test",
    type: "input",
    name: "test",
    message: "Enter the TEST environment config db URL"
  },
  {
    env: "staging",
    type: "input",
    name: "staging",
    message: "Enter the STAGING environment config db URL"
  },
  {
    env: "production",
    type: "input",
    name: "production",
    message: "Enter the PRODUCTION environment config db URL"
  }
];

const confirmEnvUrls = [
  {
    type: "confirm",
    name: "confirmation_env_urls",
    message:
      "CHECK YOUR CONFIG DB URL ANSWERS. Are they definitely correct for each environment?"
  }
];

const confirmSeedData = [
  {
    type: "confirm",
    name: "confirmation_seed_data",
    message:
      "CHECK YOUR ANSWERS, CHECK IF YOU HAVE UPDATED THE PATH (IF RELEVANT). Bear in mind that there may be data being pushed from a file that you have not entered during this script. Is everything correct?"
  }
];

module.exports = {
  collectionQuestion,
  envQuestions,
  envUrlQuestions,
  confirmEnvUrls,
  confirmSeedData
};
