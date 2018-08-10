require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const testTemplateID = "e1465fad-9f95-475a-9e38-0603d1341e8c";
const testTemplateData = { test_variable: "Hello world" };
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";
const invalidRecipientEmail = "not-in-an-email-format";

describe("Notify contract: sendSingleEmail", () => {
  describe("When given valid request", () => {
    const notifyArguments = [
      testTemplateID,
      validRecipientEmail,
      testTemplateData
    ];

    it("Should both return an ID showing a successful email send (but not necessarily that it has arrived - this will not be tested)", async () => {
      process.env.DOUBLE_MODE = true;
      const doubleResult = await sendSingleEmail(...notifyArguments);
      process.env.DOUBLE_MODE = false;
      const realResult = await sendSingleEmail(...notifyArguments);
      expect(doubleResult.id).toBeDefined();
      expect(realResult.id).toBeDefined();
    });
  });

  describe("When specifying an email that is not in a valid email format", () => {
    const notifyArguments = [
      testTemplateID,
      invalidRecipientEmail,
      testTemplateData
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When specifying a template that does not exist", () => {
    const notifyArguments = [
      invalidTemplateId,
      validRecipientEmail,
      testTemplateData
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [testTemplateID, validRecipientEmail, {}];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
