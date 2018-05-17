const { GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");
const { establishments } = require("./establishmentQuery");

describe("Query: establishments", () => {
  it("should be of type [Establishment]", () => {
    // Assert
    expect(establishments.type).toEqual(new GraphQLList(establishmentType));
  });

  it("should resolve with an id of 1", () => {
    // Act
    const response = establishments.resolve();

    // Assert
    expect(response[0].id).toBe(1);
  });
});
