const { GraphQLString, GraphQLID, GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");

describe("Type: Establishment", () => {
  it("Should have an ID field with type GraphQLID", () => {
    expect(establishmentType.getFields()).toHaveProperty("id");
    expect(establishmentType.getFields().id.type).toBe(GraphQLID);
  });

  it("Should have an Operator Mobile Numbers field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "operator_mobile_numbers"
    );
    expect(establishmentType.getFields().operator_mobile_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Home Numbers field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "operator_home_numbers"
    );
    expect(establishmentType.getFields().operator_home_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Work Numbers field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "operator_work_numbers"
    );
    expect(establishmentType.getFields().operator_work_numbers.type).toEqual(
      new GraphQLList(GraphQLString)
    );
  });

  it("Should have an Operator Text Phone Numbers field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "operator_text_phone_numbers"
    );
    expect(
      establishmentType.getFields().operator_text_phone_numbers.type
    ).toEqual(new GraphQLList(GraphQLString));
  });

  it("Should have an Operator Type Talk Numbers field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty(
      "operator_type_talk_numbers"
    );
    expect(
      establishmentType.getFields().operator_type_talk_numbers.type
    ).toEqual(new GraphQLList(GraphQLString));
  });

  it("Should have an Operator Email field with type GraphQLString", () => {
    expect(establishmentType.getFields()).toHaveProperty("operator_email");
    expect(establishmentType.getFields().operator_email.type).toBe(
      GraphQLString
    );
  });
});
