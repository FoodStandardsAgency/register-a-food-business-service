const { docDefinitionGenerator, createTitle } = require("./pdf-config");

describe("Function: createTitle", () => {
  let titleArray;
  beforeEach(() => {
    titleArray = createTitle("hello");
  });

  it("Should return an array", () => {
    expect(Array.isArray(titleArray)).toBe(true);
  });

  it("Should return an array", () => {
    expect(titleArray[0].columns[0].text).toBe("hello");
  });
});