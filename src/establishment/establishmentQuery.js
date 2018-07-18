const { GraphQLList, GraphQLID } = require("graphql");
const { getEstablishmentById } = require("./establishmentResolvers");
const establishmentType = require("./establishmentType");

const establishment = {
  type: establishmentType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: (parentValue, args) => {
    return getEstablishmentById(args.id);
  }
};

const establishments = {
  type: new GraphQLList(establishmentType),
  resolve: () => {
    return [
      {
        id: 1,
        establishment_first_line: "123",
        establishment_street: "Street Road",
        establishment_town: "London",
        establishment_postcode: "SW2"
      }
    ];
  }
};

module.exports = { establishment, establishments };
