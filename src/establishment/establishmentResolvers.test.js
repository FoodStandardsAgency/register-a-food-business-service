const { createEstablishment } = require("./establishmentResolvers");

describe("Function: createEstablishment", () => {
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

  describe("When: given an invalid declaration", () => {
    it("Should return declaration error", () => {
      // Arrange
      const declaration1 = "";
      const declaration2 = "";
      const declaration3 = "";
      let errorResponse;

      // Act
      try {
        createEstablishment({ declaration1, declaration2, declaration3 });
      } catch (err) {
        errorResponse = err;
      }

      // Assert
      expect(errorResponse.message).toBe("The request is invalid.");
      console.log(errorResponse);
      expect(errorResponse.state.declaration1[0]).toBe("Invalid declaration1");
      expect(errorResponse.state.declaration2[0]).toBe("Invalid declaration2");
      expect(errorResponse.state.declaration3[0]).toBe("Invalid declaration3");
    });
  });

  describe("When given valid input", () => {
    it("Should return establishment object", () => {
      // Arrange
      const establishment = {
        declaration1: "good declaration",
        declaration2: "good declaration",
        declaration3: "good declaration"
      };

      // Act
      const response = createEstablishment(establishment);

      // Assert
      expect(response).toEqual(establishment);
    });
  });
});
