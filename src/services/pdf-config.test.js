const {
  docDefinitionGenerator,
  createTitle,
  createSingleLine
} = require("./pdf-config");

describe("Function: createTitle", () => {
  let titleArray;
  beforeEach(() => {
    titleArray = createTitle("hello");
  });

  it("Should return an array", () => {
    expect(Array.isArray(titleArray)).toBe(true);
  });

  it("Should set the text to be the value passed into the function", () => {
    expect(titleArray[0].columns[0].text).toBe("hello");
  });
});

describe("Function: createSingleLine", () => {
  let singleLineArray;
  beforeEach(() => {
    singleLineArray = createSingleLine("operator", "John");
    createGreyLine: jest.fn();
  });

  it("Should return an array", () => {
    expect(Array.isArray(singleLineArray)).toBe(true);
  });

  it("Should create a column array whose first objects text values is the key passed in", () => {
    expect(singleLineArray[0].columns[0].text).toBe("operator");
  });

  it("Should create a column array whose second objects text values is the value passed in", () => {
    expect(singleLineArray[0].columns[0].text).toBe("John");
  });
});
