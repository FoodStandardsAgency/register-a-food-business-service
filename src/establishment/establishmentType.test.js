const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");

describe("Type: Establishment", () => {
  it("Should have an ID field with type GraphQLID", () => {
    expect(establishmentType.getFields()).toHaveProperty("id");
    expect(establishmentType.getFields().id.type).toBe(GraphQLID);
  });

  it("Should have an Establishment Postcode field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "establishment_postcode"
    );
    expect(establishmentType.getFields().establishment_postcode.type).toBe(
      GraphQLString
    );
  });
});
