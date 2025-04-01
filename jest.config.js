const { requestPromise } = require("jest-transform-stealthy-require/dist/presets");

module.exports = {
  transform: {
    ...requestPromise.transform
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern],
  verbose: true,
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/jestSetup.js"],
  reporters: [
    "default",
    ["jest-junit", { outputName: `./reports/TEST-${process.env.TEST_TYPE}.xml` }]
  ],
  coverageReporters: ["cobertura", "lcov", "json", "text"],
  moduleNameMapper: {
    winston: "<rootDir>/src/__mocks__/winston.js"
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
    "!eslint.config.js",
    "!**/src/rootMutation.js",
    "!**/src/rootQuery.js",
    "!**/src/schema.js",
    "!**/scripts/*.js",
    "!**/src/services/winston.js",
    "!**/src/services/validation.schema.js",
    "!**/src/services/validation.directSubmission.schema.js",
    "!**/src/services/validation.directSubmission.*.schema.js",
    "!**/src/services/collectionsTransform.*.keys.js",
    "!**/src/utils/express/response.js",
    "!**/src/connectors/address-lookup/addressSchema.js",
    "!**/src/db/**",
    "!**/src/config.js",
    "!**/tests/*",
    "!**/src/connectors/configDb/configDb-seed/**",
    "!**/src/**/*.router.js"
  ]
};
