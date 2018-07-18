const ValidationError = require("../errors/ValidationError");
jest.mock("../errors/ValidationError");
jest.mock("../services/validation.service", () => ({
  validate: jest.fn()
}));
jest.mock("../db/db", () => ({
  Establishment: {
    create: jest.fn(input => input),
    findOne: jest.fn()
  }
}));
const { Establishment } = require("../db/db");
const { validate } = require("../services/validation.service");
const {
  createEstablishment,
  getEstablishmentById
} = require("./establishmentResolvers");

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
      expect(response.input).toEqual("data");
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

describe("Function: getEstablishmentById", () => {
  describe("When Establishment.findOne fails", () => {
    beforeEach(() => {
      Establishment.findOne.mockImplementation(() => {
        throw new Error("test");
      });
    });

    it("Should throw error", async () => {
      // Arrange
      let errorResponse;

      // Act
      try {
        await getEstablishmentById();
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("test");
    });
  });

  describe("when Establishment.findOne succeeds", () => {
    beforeEach(() => {
      Establishment.findOne.mockImplementation(() => {
        return "findOne result";
      });
    });

    it("Should call findOne with id", async () => {
      // Arrange
      const id = "123";

      // Act
      await getEstablishmentById(id);

      // Assert
      expect(Establishment.findOne).toHaveBeenCalledWith({
        where: { id: "123" }
      });
    });

    it("Should return result of findOne call", async () => {
      // Arrange

      // Act
      const response = await getEstablishmentById();

      // Assert
      expect(response).toBe("findOne result");
    });
  });
});
