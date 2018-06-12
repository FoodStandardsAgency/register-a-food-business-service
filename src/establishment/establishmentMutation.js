const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");
const { createEstablishment } = require("./establishmentResolvers");

module.exports = {
  type: establishmentType,
  args: {
    id: {
      type: GraphQLID
    },
    establishment_first_line: {
      type: GraphQLString
    },
    establishment_street: {
      type: GraphQLString
    },
    establishment_town: {
      type: GraphQLString
    },
    establishment_postcode: {
      type: GraphQLString
    },
    declaration1: {
      type: GraphQLString
    },
    declaration2: {
      type: GraphQLString
    },
    declaration3: {
      type: GraphQLString
    }
  },
  resolve: (root, args) => {
    return createEstablishment(args);
  }
};
