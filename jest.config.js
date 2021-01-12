const { requestPromise } = require('jest-transform-stealthy-require/dist/presets');
module.exports = {
  transform: {
    ...requestPromise.transform
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern],
  verbose: true,
  testEnvironment: "node",
  reporters: [
    "default",
    ["jest-junit", { outputName: `./reports/TEST-${process.env.TEST_TYPE}.xml` }]
  ],
  coverageReporters: ["cobertura", "lcov", "json", "text"],
  moduleNameMapper: {
    winston: "<rootDir>/src/__mocks__/winston.js",
    events: "<rootDir>/src/__mocks__/events.js"
  },
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/coverage/**",
    "!**/tests/**",
    "!**/features/**",
    "!**/jest.config.js",
    "!**/cucumber.js",
    "!**/src/app.js",
    "!**/src/rootMutation.js",
    "!**/src/rootQuery.js",
    "!**/src/schema.js",
    "!**/src/services/validation.schema.js",
    "!**/src/services/validationLcSubmission.schema.js",
    "!**/src/connectors/address-lookup/addressSchema.js",
    "!**/src/db/**",
    "!**/src/config.js",
    "!**/tests/*",
    "!**/src/**/*.double.js",
    "!**/src/connectors/configDb/configDb-seed/**",
    "!**/src/**/*.router.js"
  ]
};
