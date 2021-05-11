const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
const mockSupplierConfig = require("./mockSupplierConfig.json");

const lcConfigCollectionDouble = {
  find: () => ({
    toArray: () => mockLocalCouncilConfig
  })
};

const supplierCollectionDouble = {
  find: () => ({
    toArray: () => mockSupplierConfig
  })
};

module.exports = { lcConfigCollectionDouble, supplierCollectionDouble };
