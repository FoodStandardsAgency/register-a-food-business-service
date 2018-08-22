require("dotenv").config();
const {
  getAllLocalCouncilConfig
} = require("../../src/connectors/configDb/configDb.connector");

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
    // expect(doubleResult.id).toBeDefined();
    // expect(realResult.id).toBeDefined();
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
