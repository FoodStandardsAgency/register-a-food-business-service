jest.mock("../../services/validation.service", () => ({
  validate: jest.fn()
}));
jest.mock("./registration.service", () => ({
  saveRegistration: jest.fn()
}));
const { saveRegistration } = require("./registration.service");
const { validate } = require("../../services/validation.service");
const { createNewRegistration } = require("./registration.controller");

describe("registration controller", () => {
  let result;

  describe("Function: createNewRegistration", () => {
    describe("when given valid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        saveRegistration.mockImplementation(() => {
          return "345";
        });
        result = await createNewRegistration("input");
      });

      it("should return the result of saveRegistration", () => {
        expect(result).toBe("345");
      });
    });

    describe("when given invalid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return ["ERROR"];
        });
        try {
          result = await createNewRegistration("input");
        } catch (err) {
          result = err;
        }
      });

      it("should return the registration", () => {
        expect(result.message).toBe("validation error");
      });
    });
  });
});
