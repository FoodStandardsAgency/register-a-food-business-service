const { GraphQLError } = require("graphql");

class ValidationError extends GraphQLError {
  constructor(errors) {
    super("The request is invalid.");
    const state = {};
    errors.forEach(err => {
      if (state[err.key]) {
        state[err.key].push(err.message);
      } else {
        state[err.key] = [err.message];
      }
    });
    this.state = state;
  }
}

module.exports = ValidationError;
