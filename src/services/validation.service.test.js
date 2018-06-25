jest.mock("./validation.schema", () => ({
  establishment: {
    type: "object",
    properties: {
      operator_first_name: {
        type: "string",
        validation: input => input === "true"
      },
      operator_last_name: {
        type: "string",
        validation: input => input === "true"
      },
      operator_primary_number: {
        type: "string",
        validation: input => input === "true"
      },
      operator_company_name: {
        type: "string",
        validation: input => input === "true"
      },
      operator_company_house_number: {
        type: "string",
        validation: input => input === "true"
      }
    }
  }
}));

const { validate } = require("./validation.service");

describe("Function: validate", () => {
  describe("When given valid input", () => {
    it("Should return empty array", () => {
      // Arrange
      const establishment = {
        operator_first_name: "true",
        operator_last_name: "true",
        operator_primary_number: "true",
        operator_company_name: "true",
        operator_company_house_number: "true"
      };

      // Act
      const response = validate(establishment);

      // Assert
      expect(response).toEqual([]);
    });
  });

  describe("When given invalid input", () => {
    it("Should return array with error for each invalid field", () => {
      // Arrange
      const establishment = {
        operator_first_name: "false",
        operator_last_name: "false",
        operator_primary_number: "false",
        operator_company_name: "false",
        operator_company_house_number: "false"
      };

      // Act
      const response = validate(establishment);

      // Assert
      expect(response.length).toBe(5);
      expect(response[0].key).toBe("operator_first_name");
      expect(response[1].key).toBe("operator_last_name");
      expect(response[2].key).toBe("operator_primary_number");
      expect(response[3].key).toBe("operator_company_name");
      expect(response[4].key).toBe("operator_company_house_number");
    });
  });
});
