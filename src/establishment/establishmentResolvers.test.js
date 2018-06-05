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

  describe("When: given an invalid establishment first line", () => {
    it("Should return establishment first line error", () => {
      // Arrange
      const establishment_first_line = "±«Ψ";
      let errorResponse;

      // Act
      try {
        createEstablishment({ establishment_first_line });
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("The request is invalid.");
      expect(errorResponse.state.establishment_first_line[0]).toBe(
        "Invalid establishment first line"
      );
    });
  });

  describe("When: given an invalid establishment postcode", () => {
    it("Should return establishment postcode error", () => {
      // Arrange
      const establishment_postcode = "AA";
      let errorResponse;

      // Act
      try {
        createEstablishment({ establishment_postcode });
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("The request is invalid.");
      expect(errorResponse.state.establishment_postcode[0]).toBe(
        "Invalid establishment postcode"
      );
    });
  });

  describe("When given valid input", () => {
    it("Should return establishment object", () => {
      // Arrange
      const operator_email = "email@email.com";

      // Act
      const response = createEstablishment({ operator_email });

      // Assert
      expect(response).toEqual({ operator_email: "email@email.com" });
    });
  });
});
