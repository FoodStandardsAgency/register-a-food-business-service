jest.mock("./validation.schema", () => ({
  registration: {
    type: "object",
    properties: {
      operator_first_name: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_last_name: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_primary_number: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_company_name: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_companies_house_number: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_charity_name: {
        type: "string",
        validation: (input) => input === "true"
      },
      operator_charity_number: {
        type: "string",
        validation: (input) => input === "true"
      },
      establishment_primary_number: {
        type: "string",
        validation: (input) => input === "true"
      }
    }
  }
}));

jest.mock("./validation.directSubmission.v3.schema", () => ({
  registration: {
    type: "object",
    properties: {
      test_lc_submission_v3: {
        type: "string",
        validation: (input) => input === "true"
      }
    }
  }
}));

jest.mock("./validation.directSubmission.v4.schema", () => ({
  registration: {
    type: "object",
    properties: {
      test_lc_submission_v4: {
        type: "string",
        validation: (input) => input === "true"
      }
    }
  }
}));

jest.mock("./validation.directSubmission.v5.schema", () => ({
  registration: {
    type: "object",
    properties: {
      test_lc_submission_v5: {
        type: "string",
        validation: (input) => input === "true"
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
      const response = validate(establishment, "latest");

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
      const response = validate(registration, "latest");

      // Assert
      expect(response).toHaveLength(8);
      expect(response[0].property).toBe("instance.operator_first_name");
      expect(response[1].property).toBe("instance.operator_last_name");
      expect(response[2].property).toBe("instance.operator_primary_number");
      expect(response[3].property).toBe("instance.operator_company_name");
      expect(response[4].property).toBe("instance.operator_companies_house_number");
      expect(response[5].property).toBe("instance.operator_charity_name");
      expect(response[6].property).toBe("instance.operator_charity_number");
      expect(response[7].property).toBe("instance.establishment_primary_number");
    });
  });

  describe("When given valid input for LC direct submission v3", () => {
    it("Should return empty array using LC validation schema", () => {
      // Arrange
      const establishment = {
        test_lc_submission_v3: "true"
      };

      // Act
      const response = validate(establishment, "v3.0", true);

      // Assert
      expect(response).toEqual([]);
    });
  });

  describe("When given valid input for LC direct submission v4", () => {
    it("Should return empty array using LC validation schema", () => {
      // Arrange
      const establishment = {
        test_lc_submission_v4: "true"
      };

      // Act
      const response = validate(establishment, "v4.0", true);

      // Assert
      expect(response).toEqual([]);
    });
  });

  describe("When given valid input for LC direct submission v5", () => {
    it("Should return empty array using LC validation schema", () => {
      // Arrange
      const establishment = {
        test_lc_submission_v5: "true"
      };

      // Act
      const response = validate(establishment, "v5.0", true);

      // Assert
      expect(response).toEqual([]);
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
      const response = validate(establishment, "latest");

      // Assert
      expect(response).toHaveLength(0);
    });
  });
});
