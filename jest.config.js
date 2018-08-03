module.exports = {
  verbose: true,
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
    "!**/src/**/*.double.js"
  ]
};
