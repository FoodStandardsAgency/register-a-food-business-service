require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const validTemplateId = "integration-test";
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";
const invalidRecipientEmail = "not-in-an-email-format";
const testFlattenedData = {
  establishment_trading_name: "example"
};

describe("Notify integration: sendSingleEmail", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });

  describe("When given a valid request", () => {
    const notifyArguments = [
      validTemplateId,
      validRecipientEmail,
      testFlattenedData
    ];

    it("Should return an ID showing a successful email send", async () => {
      const result = await sendSingleEmail(...notifyArguments);
      expect(result.id).toBe("123-456");
    });
  });

  describe("When specifying an email that is not in a valid email format", () => {
    const notifyArguments = [
      validTemplateId,
      invalidRecipientEmail,
      testFlattenedData
    ];

    it("Should return null", async () => {
      const result = await sendSingleEmail(...notifyArguments);
      expect(result).toBe(null);
    });
  });

  describe("When specifying a template that does not exist", () => {
    const notifyArguments = [
      invalidTemplateId,
      validRecipientEmail,
      testFlattenedData
    ];

    it("Should return null", async () => {
      const result = await sendSingleEmail(...notifyArguments);
      expect(result).toBe(null);
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [
      validTemplateId,
      validRecipientEmail,
      { this_should_include_estabishment_trading_name: "not there" }
    ];

    it("Should return null", async () => {
      const result = await sendSingleEmail(...notifyArguments);
      expect(result).toBe(null);
    });
  });
});
