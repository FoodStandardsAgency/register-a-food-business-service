jest.mock("./validation.schema", () => ({
  registration: {
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
      operator_companies_house_number: {
        type: "string",
        validation: input => input === "true"
      },
      operator_charity_name: {
        type: "string",
        validation: input => input === "true"
      },
      operator_charity_number: {
        type: "string",
        validation: input => input === "true"
      },
      establishment_primary_number: {
        type: "string",
        validation: input => input === "true"
      }
    }
  }
}));

jest.mock("./logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
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
        operator_companies_house_number: "true",
        operator_charity_name: "true",
        operator_charity_number: "true",
        establishment_primary_number: "true"
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
      const registration = {
        operator_first_name: "false",
        operator_last_name: "false",
        operator_primary_number: "false",
        operator_company_name: "false",
        operator_companies_house_number: "false",
        operator_charity_name: "false",
        operator_charity_number: "false",
        establishment_primary_number: "false"
      };

      // Act
      const response = validate(registration);

      // Assert
      expect(response.length).toBe(8);
      expect(response[0].property).toBe("instance.operator_first_name");
      expect(response[1].property).toBe("instance.operator_last_name");
      expect(response[2].property).toBe("instance.operator_primary_number");
      expect(response[3].property).toBe("instance.operator_company_name");
      expect(response[4].property).toBe(
        "instance.operator_companies_house_number"
      );
      expect(response[5].property).toBe("instance.operator_charity_name");
      expect(response[6].property).toBe("instance.operator_charity_number");
      expect(response[7].property).toBe(
        "instance.establishment_primary_number"
      );
    });
  });

  describe("When given undefined input", () => {
    it("Should not validate that field", () => {
      // Arrange
      const establishment = {
        operator_first_name: undefined,
        operator_last_name: undefined,
        operator_primary_number: "true",
        operator_company_name: "true",
        operator_companies_house_number: "true",
        operator_charity_name: "true",
        operator_charity_number: "true"
      };

      // Act
      const response = validate(establishment);

      // Assert
      expect(response.length).toBe(0);
    });
  });
});
