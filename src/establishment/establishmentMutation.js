const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");
const { createEstablishment } = require("./establishmentResolvers");

module.exports = {
  type: establishmentType,
  args: {
    id: { type: GraphQLID },
    operator_mobile_numbers: { type: new GraphQLList(GraphQLString) },
    operator_home_numbers: { type: new GraphQLList(GraphQLString) },
    operator_work_numbers: { type: new GraphQLList(GraphQLString) },
    operator_text_phone_numbers: { type: new GraphQLList(GraphQLString) },
    operator_type_talk_numbers: { type: new GraphQLList(GraphQLString) },
    operator_email: { type: GraphQLString }
  },
  resolve: (root, args) => {
    return createEstablishment(args);
  }
};
