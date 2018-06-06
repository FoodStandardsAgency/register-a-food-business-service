const { GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");

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

module.exports = { establishments };
