jest.mock("../../connectors/registrationDb/registrationDb", () => ({
  createActivities: jest.fn(),
  createEstablishment: jest.fn(),
  createMetadata: jest.fn(),
  createOperator: jest.fn(),
  createPremise: jest.fn(),
  createRegistration: jest.fn()
}));
const {
  createRegistration
} = require("../../connectors/registrationDb/registrationDb");

const { saveRegistration } = require("./registration.service");

describe("Function: saveRegistration: ", () => {
  let result;
  beforeEach(async () => {
    createRegistration.mockImplementation(() => {
      return "435";
    });
    result = await saveRegistration();
  });

  it("Should return the result of createRegistration", () => {
    expect(result).toBe("435");
  });
});
