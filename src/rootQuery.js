const { GraphQLObjectType } = require("graphql");
const { establishments } = require("./establishment/establishmentQuery");

module.exports = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    establishments
  })
});
