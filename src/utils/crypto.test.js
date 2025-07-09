"use strict";

const crypto = require("crypto");
const { ENCRYPTION_KEY } = require("../config");
const { encryptId, decryptId } = require("./crypto");

describe("crypto utility", () => {
  let originalKey;

  beforeEach(() => {
    // Save original encryption key to restore it after tests
    originalKey = process.env.ENCRYPTION_KEY;
    // Ensure test environment has a valid encryption key
    process.env.ENCRYPTION_KEY =
      process.env.ENCRYPTION_KEY ||
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
  });

  afterEach(() => {
    // Restore original encryption key
    process.env.ENCRYPTION_KEY = originalKey;
  });

  describe("encryptId", () => {
    it("should encrypt a string ID", () => {
      const id = "test123";
      const encrypted = encryptId(id);

      // Check format (IV:encryptedData)
      expect(encrypted).toContain(":");
      const [iv, encryptedData] = encrypted.split(":");

      // IV should be 16 bytes (32 hex chars)
      expect(iv.length).toBe(32);
      // Encrypted data should exist
      expect(encryptedData).toBeTruthy();

      // Test that the result is different each time due to random IV
      const secondEncrypted = encryptId(id);
      expect(encrypted).not.toEqual(secondEncrypted);
    });

    it("should encrypt a numeric ID", () => {
      const id = 12345;
      const encrypted = encryptId(id);

      // Check that ID is properly converted to string before encryption
      expect(encrypted).toContain(":");
      expect(typeof encrypted).toBe("string");
    });
  });

  describe("decryptId", () => {
    it("should decrypt an encrypted ID back to the original value", () => {
      const originalId = "test123";
      const encrypted = encryptId(originalId);
      const decrypted = decryptId(encrypted);

      expect(decrypted).toEqual(originalId);
    });

    it("should decrypt a numeric ID back to its string representation", () => {
      const originalId = 12345;
      const encrypted = encryptId(originalId);
      const decrypted = decryptId(encrypted);

      expect(decrypted).toEqual(originalId.toString());
    });

    it("should handle edge cases", () => {
      // Test empty string
      const emptyId = "";
      const encryptedEmpty = encryptId(emptyId);
      expect(decryptId(encryptedEmpty)).toEqual(emptyId);

      // Test special characters
      const specialId = "!@#$%^&*()_+";
      const encryptedSpecial = encryptId(specialId);
      expect(decryptId(encryptedSpecial)).toEqual(specialId);
    });
  });

  describe("error handling", () => {
    it("should throw an error when trying to decrypt invalid data", () => {
      const invalidEncrypted = "invalid:data";

      expect(() => {
        decryptId(invalidEncrypted);
      }).toThrow();
    });

    it("should throw an error when encrypted string has wrong format", () => {
      expect(() => {
        decryptId("invalidformatwithoutcolon");
      }).toThrow();
    });
  });
});
