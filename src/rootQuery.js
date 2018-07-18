const { GraphQLObjectType } = require("graphql");
const {
  establishments,
  establishment
} = require("./establishment/establishmentQuery");

module.exports = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    establishments,
    establishment
  })
});
