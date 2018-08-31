require("dotenv").config();
const {
  cacheRegistration
} = require("../../src/connectors/cacheDb/cacheDb.connector");

describe("cacheDb integration: cacheRegistration", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });

  it("Should return an ID showing a successful email send", async () => {
    const result = await cacheRegistration();
    expect(result.insertedId).toBeDefined();
  });
});
