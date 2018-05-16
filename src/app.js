const express = require('express');
const graphQL = require('express-graphql');
const schema = require('./schema.js');

const app = express();

app.use('/graphql', graphQL({
  schema,
  // graphiql: true
}))

app.listen(4000);