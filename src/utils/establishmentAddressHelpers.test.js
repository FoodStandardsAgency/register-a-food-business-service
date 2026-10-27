"use strict";

const { getEstablishmentAddress } = require("./establishmentAddressHelpers");

describe("establishmentAddressHelpers", () => {
  describe("getEstablishmentAddress", () => {
    test("should join all address parts with newlines in display order", () => {
      // Arrange
      const establishment = {
        premise: {
          establishment_address_line_1: "Test 2 Ltd",
          establishment_address_line_2: "2 Test Lane",
          establishment_address_line_3: "Testland",
          establishment_town: "Southampton",
          establishment_postcode: "SO15 7HH"
        }
      };

      // Act & Assert
      expect(getEstablishmentAddress(establishment)).toBe(
        "Test 2 Ltd\n2 Test Lane\nTestland\nSouthampton\nSO15 7HH"
      );
    });

    test("should skip missing and empty address lines", () => {
      // Arrange
      const establishment = {
        premise: {
          establishment_address_line_1: "1 High Street",
          establishment_address_line_2: "",
          establishment_town: "Cardiff",
          establishment_postcode: "CF10 1AA"
        }
      };

      // Act & Assert
      expect(getEstablishmentAddress(establishment)).toBe("1 High Street\nCardiff\nCF10 1AA");
    });

    test("should trim whitespace and ignore whitespace-only parts", () => {
      // Arrange
      const establishment = {
        premise: {
          establishment_address_line_1: "  1 High Street ",
          establishment_address_line_2: "   ",
          establishment_postcode: " CF10 1AA "
        }
      };

      // Act & Assert
      expect(getEstablishmentAddress(establishment)).toBe("1 High Street\nCF10 1AA");
    });

    test("should return an empty string when there is no premise", () => {
      // Act & Assert
      expect(getEstablishmentAddress({})).toBe("");
      expect(getEstablishmentAddress(undefined)).toBe("");
    });
  });
});
