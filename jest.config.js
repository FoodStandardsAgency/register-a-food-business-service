module.exports = {
  verbose: true,
  testEnvironment: "node",
  reporters: ["default", "jest-junit"],
  moduleNameMapper: {
    "logging.service": "<rootDir>/src/__mocks__/logging.service.js",
    "statusEmitter.service": "<rootDir>/src/__mocks__/statusEmitter.service.js"
  },
  collectCoverageFrom: [
    "**/*.{js}",
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
    "!**/src/db/**",
    "!**/src/config.js",
    "!**/tests/*",
    "!**/src/**/*.double.js",
    "!**/src/**/*.seed.js"
  ]
};
