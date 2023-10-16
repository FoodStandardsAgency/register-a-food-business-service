require("dotenv").config();
const {
  cacheRegistration
} = require("../../src/connectors/cacheDb/cacheDb.connector");

let doubleResult;
let realResult;

describe("cacheDb contract: cacheRegistration", () => {
  beforeEach(async () => {
    doubleResult = await cacheRegistration({
      registration: {
        data: "data"
      }
    });

    realResult = await cacheRegistration({
      registration: {
        data: "data"
      }
    });
  });

  it("Should return insertedId", async () => {
    expect(doubleResult.insertedId).toBeDefined();
    expect(realResult.insertedId).toBeDefined();
  });
});
