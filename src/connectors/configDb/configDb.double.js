const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");

const lcConfigCollectionDouble = {
  find: () => ({
    toArray: () => mockLocalCouncilConfig
  })
};

module.exports = { lcConfigCollectionDouble };
