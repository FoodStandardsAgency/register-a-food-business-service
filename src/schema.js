const { GraphQLSchema } = require('graphql');
const mutation = require('./rootMutation');
const query = require('./rootQuery');

module.exports = new GraphQLSchema({
  query, 
  mutation
});