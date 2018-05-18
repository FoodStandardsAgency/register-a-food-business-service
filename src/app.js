const express = require("express");
const graphQL = require("express-graphql");
const schema = require("./schema.js");

const app = express();

app.use(
  "/graphql",
  graphQL({
    schema,
    graphiql: true,
    formatError: error => ({
      message: error.message,
      state: error.originalError && error.originalError.state,
      locations: error.locations,
      path: error.path
    }),
  })
);

app.listen(4000);
