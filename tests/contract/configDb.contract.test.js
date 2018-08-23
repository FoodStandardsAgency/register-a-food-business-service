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
      lcName: { type: "string", required: true },
      lcNotificationEmails: {
        type: "array",
        required: true,
        items: { type: "string" }
      },
      lcContactEmail: { type: "string", required: true },
      urlString: { type: "string", required: true },
      separateStandardsCouncil: { type: "number", required: false }
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
    expect(westDorsetDouble.lcName).toEqual(westDorsetReal.lcName);
    expect(westDorsetDouble.separateStandardsCouncil).toEqual(
      westDorsetReal.separateStandardsCouncil
    );

    const dorsetCountyDouble = doubleResult.find(
      council => council._id === westDorsetDouble.separateStandardsCouncil
    );
    const dorsetCountyReal = realResult.find(
      council => council._id === westDorsetReal.separateStandardsCouncil
    );
    expect(dorsetCountyDouble.lcName).toEqual(dorsetCountyReal.lcName);
  });
});
