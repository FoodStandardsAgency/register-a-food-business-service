const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");
jest.mock("./establishmentResolvers");
const { createEstablishment } = require("./establishmentResolvers");
const establishmentMutation = require("./establishmentMutation");

describe("Mutation: createEstablishment", () => {
  it("should be of type [Establishment]", () => {
    // Assert
    expect(establishmentMutation.type).toEqual(establishmentType);
  });

  it("should have an ID argument with type GraphQLID", () => {
    expect(establishmentMutation.args).toHaveProperty("id");
    expect(establishmentMutation.args.id.type).toBe(GraphQLID);
  });

  it("Should have an Establishment First Line argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty(
      "establishment_first_line"
    );
    expect(establishmentMutation.args.establishment_first_line.type).toBe(
      GraphQLString
    );
  });

  it("Should have an Establishment Street argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("establishment_street");
    expect(establishmentMutation.args.establishment_street.type).toBe(
      GraphQLString
    );
  });

  it("Should have an Establishment Town argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("establishment_town");
    expect(establishmentMutation.args.establishment_town.type).toBe(
      GraphQLString
    );
  });

  it("Should have an Establishment Postcode argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("establishment_postcode");
    expect(establishmentMutation.args.establishment_postcode.type).toBe(
      GraphQLString
    );
  });

  it("Should have three declaration arguments with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("declaration1");
    expect(establishmentMutation.args).toHaveProperty("declaration2");
    expect(establishmentMutation.args).toHaveProperty("declaration3");
    expect(establishmentMutation.args.declaration1.type).toBe(GraphQLString);
    expect(establishmentMutation.args.declaration2.type).toBe(GraphQLString);
    expect(establishmentMutation.args.declaration3.type).toBe(GraphQLString);
  });

  it("Should resolve by returning the result of the createEstablishment resolver with args", () => {
    // Arrange
    createEstablishment.mockImplementation = jest.fn((root, args) => {
      return args;
    });

    // Act
    establishmentMutation.resolve("root", { test: "test" });

    // Assert
    expect(createEstablishment.mock.calls.length).toBe(1);
    expect(createEstablishment.mock.calls[0][0]).toEqual({ test: "test" });
  });
});
