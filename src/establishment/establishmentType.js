const { GraphQLObjectType, GraphQLString, GraphQLID } = require("graphql");

module.exports = new GraphQLObjectType({
  name: "Establishment",
  fields: {
    id: { type: GraphQLID },
    operator_type: { type: GraphQLString },
    operator_first_name: { type: GraphQLString },
    operator_last_name: { type: GraphQLString },
    operator_primary_number: { type: GraphQLString },
    operator_secondary_number: { type: GraphQLString },
    operator_email: { type: GraphQLString },
    operator_company_name: { type: GraphQLString },
    operator_company_house_number: { type: GraphQLString },
    establishment_trading_name: { type: GraphQLString },
    establishment_first_line: { type: GraphQLString },
    establishment_street: { type: GraphQLString },
    establishment_town: { type: GraphQLString },
    establishment_postcode: { type: GraphQLString },
    declaration1: { type: GraphQLString },
    declaration2: { type: GraphQLString },
    declaration3: { type: GraphQLString }
  }
});
