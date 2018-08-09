require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const contractTestTemplateId = "e1465fad-9f95-475a-9e38-0603d1341e8c";
const contractTestTemplateData = { test_variable: "Hello world" };
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";

describe("Notify contract: sendSingleEmail", () => {
  describe("When given valid request", () => {
    const notifyArguments = [
      contractTestTemplateId,
      validRecipientEmail,
      contractTestTemplateData
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

  describe("When specifying a template that does not exist", () => {
    const notifyArguments = [
      invalidTemplateId,
      validRecipientEmail,
      contractTestTemplateData
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [contractTestTemplateId, validRecipientEmail, {}];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
