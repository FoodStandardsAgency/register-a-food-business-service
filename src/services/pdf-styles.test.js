const {
  docDefinitionGenerator,
  createTitle,
  createSingleLine,
  createGreyLine,
  createNewSpace,
  createFsaRnBox,
  createLcContactSection,
} = require("./pdf-styles");

describe("Function: createTitle", () => {
  let titleArray;
  beforeEach(() => {
    titleArray = createTitle("hello", "h2");
  });

  it("Should return an array", () => {
    expect(Array.isArray(titleArray)).toBe(true);
  });

  it("Should set the text to be the value passed into the function", () => {
    expect(titleArray[0].columns[0].text).toBe("hello");
  });

  it("Should set the style to the size param", () => {
    expect(titleArray[0].style).toBe("h2");
  });
});

describe("Function: createSingleLine", () => {
  let singleLineArray;
  beforeEach(() => {
    singleLineArray = createSingleLine("operator", "John");
  });

  it("Should return an array", () => {
    expect(Array.isArray(singleLineArray)).toBe(true);
  });

  it("Should create a column array whose first objects text values is the key passed in", () => {
    expect(singleLineArray[0].columns[0].text).toBe("operator");
  });

  it("Should create a column array whose second objects text values is the value passed in", () => {
    expect(singleLineArray[0].columns[1].text).toBe("John");
  });
});

describe("Function: createNewSpace", () => {
  let result;
  describe("When given empty input", () => {
    beforeEach(() => {
      result = createNewSpace();
    });

    it("Should return empty string", () => {
      expect(result).toBe("");
    });
  });

  describe("When given input number", () => {
    beforeEach(() => {
      result = createNewSpace(3);
    });

    it("Should return that many newLine characters", () => {
      expect(result).toBe("\n\n\n");
    });
  });
});

describe("Function: createGreyLine", () => {
  let result;
  beforeEach(() => {
    result = createGreyLine();
  });

  it("Should return a new line character at beginning and end of array", () => {
    expect(result[0]).toBe("\n");
    expect(result[2]).toBe("\n");
  });

  it("Should push grey rectangle to middle of array", () => {
    expect(result[1].canvas[0].type).toBe("rect");
    expect(result[1].canvas[0].color).toBe("#808080");
  });
});

describe("Function: createFsaRnBox", () => {
  let result;
  describe("When given single local council", () => {
    beforeEach(() => {
      result = createFsaRnBox("123456", {
        local_council: "cardiff",
      });
    });

    it("Should return the fsarn", () => {
      expect(result[2].text).toBe("123456");
    });

    it("Should put place the text at a particular position", () => {
      expect(result[1].absolutePosition.y).toBe(285);
    });

    it("Should put place the fsrnat a particular position", () => {
      expect(result[2].absolutePosition.y).toBe(320);
    });
  });

  describe("When given seperate hygeine and standards councils", () => {
    beforeEach(() => {
      result = createFsaRnBox("123456", {
        local_council_hygeine: "west-dorset",
        local_council_standards: "dorset",
      });
    });

    it("Should return the fsarn", () => {
      expect(result[2].text).toBe("123456");
    });

    it("Should put place the text at a particular position", () => {
      expect(result[1].absolutePosition.y).toBe(355);
    });

    it("Should put place the fsrnat a particular position", () => {
      expect(result[2].absolutePosition.y).toBe(390);
    });
  });
});

describe("Function: createLcContactSection", () => {
  let result;
  describe("When given a single council", () => {
    const lcInfo = { local_council: "City of Cardiff Council" };
    beforeEach(() => {
      result = createLcContactSection(lcInfo);
    });

    it("Should return an array of length 1", () => {
      expect(result.length).toBe(1);
    });
  });

  describe("When given seperate hygeine and standards councils", () => {
    const lcInfo = {
      local_council_hygeine: "City of Cardiff Council",
      local_council_standards: "Standards Council",
    };
    beforeEach(() => {
      result = createLcContactSection(lcInfo);
    });

    it("Should return an array of length greater than 1", () => {
      expect(result.length > 1).toBe(true);
    });
  });
});

describe("Function: docDefinitionGenerator", () => {
  let docDefinition;
  beforeEach(() => {
    docDefinition = docDefinitionGenerator({ some: "content" });
  });

  it("should define some default properties", () => {
    expect(docDefinition.content).toBeDefined();
    expect(docDefinition.defaultStyle).toBeDefined();
    expect(docDefinition.pageSize).toBeDefined();
    expect(docDefinition.styles).toBeDefined();
  });
});
