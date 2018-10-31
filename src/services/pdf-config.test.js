const { docDefinitionGenerator } = require("./pdf-config");

describe("doc definition function", () => {
  let result;
  const testData = {
    operator_type: "Sole Trader",
    operator_first_name: "John"
  };
  beforeEach(() => {
    result = docDefinitionGenerator(testData);
  });

  it("should return an object", () => {
    expect(typeof result).toBe("object");
  });
  it("should set the correct value of the variable", () => {
    const resultString = JSON.stringify(result);
    expect(resultString).toContain("Sole Trader");
  });
});
