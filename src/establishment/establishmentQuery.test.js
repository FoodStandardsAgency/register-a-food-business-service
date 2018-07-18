const { GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");
const { establishments, establishment } = require("./establishmentQuery");
const { getEstablishmentById } = require("./establishmentResolvers");

jest.mock("./establishmentResolvers", () => ({
  getEstablishmentById: jest.fn()
}));

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

describe("Query: establishment", () => {
  it("should be of type Establishment", () => {
    // Assert
    expect(establishment.type).toEqual(establishmentType);
  });

  it("should resolve with result of getEstablishmentById", () => {
    // Arrange
    getEstablishmentById.mockImplementation(() => {
      return "getEstablishmentById response";
    });

    // Act
    const response = establishment.resolve({}, { id: 1 });

    // Assert
    expect(response).toBe("getEstablishmentById response");
  });
});
