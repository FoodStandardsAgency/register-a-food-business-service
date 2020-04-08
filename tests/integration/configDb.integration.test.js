require("dotenv").config();
const {
  getAllLocalCouncilConfig,
} = require("../../src/connectors/configDb/configDb.connector");
const mockLocalCouncilConfig = require("../../src/connectors/configDb/mockLocalCouncilConfig.json");

describe("configDb integration: getAllLocalCouncilConfig", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });

  it("Should return an ID showing a successful email send", async () => {
    const result = await getAllLocalCouncilConfig();
    expect(result).toEqual(mockLocalCouncilConfig);
  });
});
