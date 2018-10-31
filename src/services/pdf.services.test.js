const { docDefinitionGenerator, fontDescriptors } = require("./pdf-config");
const { pdfGenerator } = require("./pdf.service");

describe("Pdf Generator function", () => {
  let result;
  const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));
  const testData = { operator_type: "Sole trader" };
  beforeEach(async () => {
    result = await pdfGenerator(testData);
  });

  it("Resolves to a base64 string", () => {
    const decoded = Buffer.from(result, "base64").toString("ascii");
    expect(typeof result).toBe("string");
  });

  it("doesnt modify the original font descriptor", () => {
    expect(fontDescriptors).toEqual(clonedFontDes);
  });
});
