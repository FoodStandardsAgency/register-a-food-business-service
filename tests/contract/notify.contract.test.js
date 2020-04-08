require("dotenv").config();
const {
  sendSingleEmail,
} = require("../../src/connectors/notify/notify.connector");

const { NOTIFY_TEMPLATE_ID_TEST } = require("../../src/config");
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";
const invalidRecipientEmail = "not-in-an-email-format";
const testFlattenedData = {
  establishment_trading_name: "example",
};

describe("Notify contract: sendSingleEmail", () => {
  describe("When given valid request", () => {
    const notifyArguments = [
      NOTIFY_TEMPLATE_ID_TEST,
      validRecipientEmail,
      testFlattenedData,
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
      NOTIFY_TEMPLATE_ID_TEST,
      invalidRecipientEmail,
      testFlattenedData,
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
      testFlattenedData,
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [
      NOTIFY_TEMPLATE_ID_TEST,
      validRecipientEmail,
      { this_should_include_estabishment_trading_name: "not there" },
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
