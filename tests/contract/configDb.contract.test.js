require("dotenv").config();
const {
  getAllLocalCouncilConfig
} = require("../../src/connectors/configDb/configDb.connector");
const { Validator } = require("jsonschema");

const validator = new Validator();

const lcConfigSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      _id: { type: "number", required: true },
      local_council: { type: "string", required: true },
      local_council_notify_emails: {
        type: "array",
        required: true,
        items: { type: "string" }
      },
      local_council_email: { type: "string", required: true },
      local_council_url: { type: "string", required: true },
      separate_standards_council: { type: "number", required: false }
    }
  }
};

let doubleResult;
let realResult;

describe("configDb contract: getAllLocalCouncilConfig", () => {
  beforeEach(async () => {
    process.env.DOUBLE_MODE = true;
    doubleResult = await getAllLocalCouncilConfig();

    process.env.DOUBLE_MODE = false;
    realResult = await getAllLocalCouncilConfig();
  });

  it("Should both pass format validation", async () => {
    expect(validator.validate(doubleResult, lcConfigSchema).errors.length).toBe(
      0
    );
    expect(validator.validate(realResult, lcConfigSchema).errors.length).toBe(
      0
    );
  });

  it("Should both contain two example sets of council data that are unlikely to change", async () => {
    const westDorsetDouble = doubleResult.find(council => council._id === 4221);
    const westDorsetReal = realResult.find(council => council._id === 4221);
    expect(westDorsetDouble.local_council).toEqual(
      westDorsetReal.local_council
    );
    expect(westDorsetDouble.separate_standards_council).toEqual(
      westDorsetReal.separate_standards_council
    );

    const dorsetCountyDouble = doubleResult.find(
      council => council._id === westDorsetDouble.separate_standards_council
    );
    const dorsetCountyReal = realResult.find(
      council => council._id === westDorsetReal.separate_standards_council
    );
    expect(dorsetCountyDouble.local_council).toEqual(
      dorsetCountyReal.local_council
    );
  });
});
