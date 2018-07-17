const ValidationError = require("../errors/ValidationError");
jest.mock("../errors/ValidationError");
jest.mock("../services/validation.service", () => ({
  validate: jest.fn()
}));
jest.mock("../db/db", () => ({
  Establishment: {
    create: jest.fn(input => input)
  }
}));
const { Establishment } = require("../db/db");
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

    it("Should return input", async () => {
      // Arrange
      const data = { input: "data" };

      // Act
      const response = await createEstablishment(data);

      // Assert
      expect(response).toEqual(data);
    });
  });

  describe("When given invalid input", () => {
    beforeEach(() => {
      validate.mockImplementation(() => [{ some: "error" }]);
    });
    it("Should throw a new ValidationError", async () => {
      // Arrange
      const data = { input: "data" };
      let errorResponse;

      // Act
      try {
        await createEstablishment(data);
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(ValidationError).toBeCalled();
      expect(errorResponse).toBeDefined();
    });
  });

  describe("When db create function fails", () => {
    beforeEach(() => {
      validate.mockImplementation(() => []);
      Establishment.create.mockImplementation(() => {
        throw new Error("test");
      });
    });
    it("Should throw error", async () => {
      // Arrange
      let errorResponse;

      // Act
      try {
        await createEstablishment();
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("test");
    });
  });
});
