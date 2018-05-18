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

  it("Should have an Operator Mobile Numbers argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty(
      "operator_mobile_numbers"
    );
    expect(establishmentMutation.args.operator_mobile_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Home Numbers argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("operator_home_numbers");
    expect(establishmentMutation.args.operator_home_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Work Numbers argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("operator_work_numbers");
    expect(establishmentMutation.args.operator_work_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Text Phone Numbers argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty(
      "operator_text_phone_numbers"
    );
    expect(establishmentMutation.args.operator_text_phone_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Type Talk Numbers argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty(
      "operator_type_talk_numbers"
    );
    expect(establishmentMutation.args.operator_type_talk_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Email argument with type GraphQLString", () => {
    expect(establishmentMutation.args).toHaveProperty("operator_email");
    expect(establishmentMutation.args.operator_email.type).toBe(GraphQLString);
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
