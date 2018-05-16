const { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList } = require('graphql');

module.exports = new GraphQLObjectType({
  name: 'Establishment',
  fields: {
    id: { type: GraphQLID },
    operator_mobile_numbers: { type: new GraphQLList(GraphQLString) },
    operator_home_numbers: { type: new GraphQLList(GraphQLString) },
    operator_work_numbers: { type: new GraphQLList(GraphQLString) },
    operator_text_phone_numbers: { type: new GraphQLList(GraphQLString) },
    operator_type_talk_numbers: { type: new GraphQLList(GraphQLString) },
    operator_email: { type: GraphQLString }
  }
});