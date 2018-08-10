require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const testTemplateID = "e1465fad-9f95-475a-9e38-0603d1341e8c";
const testTemplateData = { test_variable: "Hello world" };
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";
const invalidRecipientEmail = "not-in-an-email-format";

describe("Notify integration: sendSingleEmail", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });

  describe("When given a valid request", () => {
    const notifyArguments = [
      testTemplateID,
      validRecipientEmail,
      testTemplateData
    ];

    it("Should return an ID showing a successful email send", async () => {
      const result = await sendSingleEmail(...notifyArguments);
      expect(result.id).toBe("123-456");
    });
  });

  describe("When specifying an email that is not in a valid email format", () => {
    const notifyArguments = [
      testTemplateID,
      invalidRecipientEmail,
      testTemplateData
    ];

    it("Should reject", async () => {
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When specifying a template that does not exist", () => {
    const notifyArguments = [
      invalidTemplateId,
      validRecipientEmail,
      testTemplateData
    ];

    it("Should reject", async () => {
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [testTemplateID, validRecipientEmail, {}];

    it("Should reject", async () => {
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
