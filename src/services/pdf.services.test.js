const { pdfGenerator } = require("./pdf.service");

describe("Pdf Generator function", () => {
  let result;
  beforeEach(async () => {
    result = await pdfGenerator();
  });

  it("Resolves to a base64 string", () => {
    const decoded = Buffer.from(result, "base64").toString("ascii");
    expect(typeof result).toBe("string");
  });

  it("doesnt modify the original doc definition", () => {});
});
