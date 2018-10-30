const { docDefinition, fontDescriptors } = require("./pdf-config");
const { pdfGenerator } = require("./pdf.service");

describe("Pdf Generator function", () => {
  let result;
  const clonedDocDef = JSON.parse(JSON.stringify(docDefinition));
  const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));

  beforeEach(async () => {
    result = await pdfGenerator();
  });

  it("Resolves to a base64 string", () => {
    const decoded = Buffer.from(result, "base64").toString("ascii");
    expect(typeof result).toBe("string");
  });

  it("doesnt modify the original doc definition", () => {
    expect(docDefinition).toEqual(clonedDocDef);
  });

  it("doesnt modify the original font descriptor", () => {
    expect(fontDescriptors).toEqual(clonedFontDes);
  });
});
