"use strict";

const { operatorTypeEnum } = require("@slice-and-dice/register-a-food-business-validation");
const {
  getOperatorName,
  getMainPartnershipContactName,
  operatorNameBuilders
} = require("./operatorNameHelpers");

describe("operatorNameHelpers", () => {
  describe("operatorNameBuilders exhaustiveness", () => {
    test("should have a handler for every operator type in the validation enum", () => {
      // If this fails after a validation package update, a new operator type has been
      // added without deciding what name it should display in emails - add a handler
      // to operatorNameBuilders (and a getOperatorName test) for the new type.
      Object.keys(operatorTypeEnum).forEach((operatorType) => {
        expect(operatorNameBuilders).toHaveProperty(operatorType);
      });
    });

    test("should not have handlers for operator types absent from the validation enum", () => {
      Object.keys(operatorNameBuilders).forEach((operatorType) => {
        expect(operatorTypeEnum).toHaveProperty(operatorType);
      });
    });
  });

  describe("getOperatorName", () => {
    test("should return first and last name for a sole trader", () => {
      // Arrange
      const operator = {
        operator_type: "SOLETRADER",
        operator_first_name: "John",
        operator_last_name: "Doe"
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("John Doe");
    });

    test("should return first and last name for a person registered by a representative", () => {
      // Arrange
      const operator = {
        operator_type: "PERSON",
        operator_first_name: "Priya",
        operator_last_name: "Patel",
        contact_representative_name: "Carol Represent"
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Priya Patel");
    });

    test("should return all partner names for a partnership", () => {
      // Arrange
      const operator = {
        operator_type: "PARTNERSHIP",
        partners: [
          { partner_name: "Alice Smith", partner_is_primary_contact: false },
          { partner_name: "Bob Jones", partner_is_primary_contact: true }
        ]
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Alice Smith, Bob Jones");
    });

    test("should comma-separate three or more partner names", () => {
      // Arrange
      const operator = {
        operator_type: "PARTNERSHIP",
        partners: [
          { partner_name: "Alice Smith", partner_is_primary_contact: true },
          { partner_name: "Bob Jones", partner_is_primary_contact: false },
          { partner_name: "Carol White", partner_is_primary_contact: false }
        ]
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Alice Smith, Bob Jones, Carol White");
    });

    test("should return the single partner name for a one-partner partnership", () => {
      // Arrange
      const operator = {
        operator_type: "PARTNERSHIP",
        partners: [{ partner_name: "Alice Smith", partner_is_primary_contact: true }]
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Alice Smith");
    });

    test("should throw when a partner is missing its name", () => {
      // Arrange
      const operator = {
        operator_type: "PARTNERSHIP",
        partners: [
          { partner_name: "Alice Smith", partner_is_primary_contact: true },
          { partner_is_primary_contact: false }
        ]
      };

      // Act & Assert
      expect(() => getOperatorName(operator)).toThrow(
        "Missing partner names in partners list"
      );
    });

    test("should throw when the partners list is missing or empty", () => {
      // Act & Assert
      expect(() => getOperatorName({ operator_type: "PARTNERSHIP" })).toThrow(
        "Missing partner names in partners list"
      );
      expect(() => getOperatorName({ operator_type: "PARTNERSHIP", partners: [] })).toThrow(
        "Missing partner names in partners list"
      );
    });

    test("should return company name for a company", () => {
      // Arrange
      const operator = {
        operator_type: "COMPANY",
        operator_company_name: "Test Food Ltd",
        operator_companies_house_number: "01234567"
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Test Food Ltd");
    });

    test("should return charity name for a charity", () => {
      // Arrange
      const operator = {
        operator_type: "CHARITY",
        operator_charity_name: "Test Food Charity",
        operator_charity_number: "1234567"
      };

      // Act & Assert
      expect(getOperatorName(operator)).toBe("Test Food Charity");
    });

    test("should throw for an unrecognised operator type", () => {
      // Arrange
      const operator = {
        operator_type: "COOPERATIVE",
        operator_company_name: "Test Food Co-op"
      };

      // Act & Assert
      expect(() => getOperatorName(operator)).toThrow(
        'Unrecognised operator type "COOPERATIVE" - unable to determine operator name'
      );
    });

    test("should throw when operator type is missing", () => {
      // Act & Assert
      expect(() => getOperatorName({ operator_first_name: "John" })).toThrow(
        "Unrecognised operator type"
      );
    });

    test("should throw when name fields for the operator type are missing", () => {
      // Arrange
      const operator = {
        operator_type: "COMPANY"
      };

      // Act & Assert
      expect(() => getOperatorName(operator)).toThrow(
        'Missing operator name fields for operator type "COMPANY"'
      );
    });

    test("should throw when only one part of a personal name is present", () => {
      // Arrange
      const operator = {
        operator_type: "SOLETRADER",
        operator_first_name: "John"
      };

      // Act & Assert
      expect(() => getOperatorName(operator)).toThrow(
        'Missing operator name fields for operator type "SOLETRADER"'
      );
    });
  });

  describe("getMainPartnershipContactName", () => {
    test("should return the primary contact partner name", () => {
      // Arrange
      const partners = [
        { partner_name: "Alice Smith", partner_is_primary_contact: false },
        { partner_name: "Bob Jones", partner_is_primary_contact: true }
      ];

      // Act & Assert
      expect(getMainPartnershipContactName(partners)).toBe("Bob Jones");
    });

    test("should throw when no partner is marked as primary contact", () => {
      // Arrange
      const partners = [{ partner_name: "Alice Smith", partner_is_primary_contact: false }];

      // Act & Assert
      expect(() => getMainPartnershipContactName(partners)).toThrow(
        "No main partnership contact found in partners list"
      );
    });

    test("should throw when partners list is missing", () => {
      // Act & Assert
      expect(() => getMainPartnershipContactName(undefined)).toThrow(
        "No main partnership contact found in partners list"
      );
    });
  });
});
