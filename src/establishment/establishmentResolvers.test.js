const { createEstablishment } = require("./establishmentResolvers");

describe("Function: createEstablishment", () => {
  describe("When: given invalid email address", () => {
    it("Should return email error", () => {
      // Arrange
      const operator_email = "sdlkf";
      let errorResponse;
      // Act
      try {
        createEstablishment({ operator_email });
      } catch (err) {
        // Assert
        errorResponse = err;
      }
      expect(errorResponse.message).toBe("The request is invalid.");
      expect(errorResponse.state.email[0]).toBe("Invalid email address");
    });
  });

  describe("When: given invalid operator mobile numbers", () => {
    it("Should return mobile number error", () => {
      // Arrange
      const operator_mobile_numbers = ["3947239487235235"];
      let errorResponse;

      // Act
      try {
        createEstablishment({ operator_mobile_numbers });
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("The request is invalid.");
      expect(errorResponse.state.operator_mobile_numbers[0]).toBe(
        "Invalid phone number"
      );
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
