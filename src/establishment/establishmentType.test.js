const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");

const testTypeProperty = (name, type) => {
  expect(establishmentType.getFields()).toHaveProperty(name);
  expect(establishmentType.getFields()[name].type).toBe(type);
}

const types = {
  "id": GraphQLID,
  "operator_first_name": GraphQLString,
  "operator_last_name": GraphQLString,
  "establishment_postcode": GraphQLString
}

describe("Type: Establishment", () => {
  it("should have all the types listed in types", () => {
    Object.keys(types).forEach((key) => {
      testTypeProperty(key, types[key]);
    });
  });
});
