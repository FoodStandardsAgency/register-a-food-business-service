const ValidationError = require("../errors/ValidationError");
jest.mock("../errors/ValidationError");
jest.mock("../services/validation.service", () => ({
  validate: jest.fn()
}));
const { validate } = require("../services/validation.service");
const { createEstablishment } = require("./establishmentResolvers");

describe("Function: createEstablishment", () => {
  describe("When given valid input", () => {
    beforeEach(() => {
      validate.mockImplementation(() => []);
    });

    it("Should validate input", () => {
      // Arrange
      const data = { input: "data" };

      // Act
      createEstablishment(data);

      // Assert
      expect(validate).toBeCalled();
    });

    it("Should return input", () => {
      // Arrange
      const data = { input: "data" };

      // Act
      const response = createEstablishment(data);

      // Assert
      expect(response).toBe(data);
    });
  });

  describe("When given invalid input", () => {
    beforeEach(() => {
      validate.mockImplementation(() => [{ some: "error" }]);
    });
    it("Should throw a new ValidationError", () => {
      // Arrange
      const data = { input: "data" };
      let errorResponse;

      // Act
      try {
        createEstablishment(data);
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(ValidationError).toBeCalled();
      expect(errorResponse).toBeDefined();
    });
  });
});
