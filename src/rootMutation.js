const { GraphQLObjectType } = require('graphql');
const createEstablishment = require('./establishment/establishmentMutation');

module.exports = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createEstablishment
  })
});