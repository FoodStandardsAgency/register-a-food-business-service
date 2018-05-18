const { createEstablishment } = require("./establishmentResolvers");

describe("Function: createEstablishment", () => {
  describe("When: given invalid email address", () => {
    it("Should return email error", () => {
      // Arrange
      const operator_email = "sdlkf";
      const error = new Error("Invalid email address");
      let errorResponse;
      // Act
      try {
        createEstablishment({ operator_email });
      } catch (err) {
        // Assert
        errorResponse = err;
      }
      expect(errorResponse).toEqual(error);
    });
  });
  describe("When given valid input", () => {
    it("Should return Establishment Created", () => {
      // Arrange
      const operator_email = "email@email.com";

      // Act
      const response = createEstablishment({ operator_email });

      // Assert
      expect(response).toBe("Establishment Created");
    });
  });
});
