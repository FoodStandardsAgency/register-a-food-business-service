jest.mock("../../connectors/registrationDb/registrationDb", () => ({
  createActivities: jest.fn(),
  createEstablishment: jest.fn(),
  createMetadata: jest.fn(),
  createOperator: jest.fn(),
  createPremise: jest.fn(),
  createRegistration: jest.fn()
}));
const {
  createRegistration,
  createEstablishment
} = require("../../connectors/registrationDb/registrationDb");

const { saveRegistration } = require("./registration.service");

describe("Function: saveRegistration: ", () => {
  let result;
  beforeEach(async () => {
    createRegistration.mockImplementation(() => {
      return { id: "435" };
    });
    createEstablishment.mockImplementation(() => {
      return { id: "225" };
    });
    result = await saveRegistration({
      establishment: {
        establishment_details: {}
      }
    });
  });

  it("Should return the result of createRegistration", () => {
    expect(result).toEqual({ regId: "435", establishmentId: "225" });
  });
});
