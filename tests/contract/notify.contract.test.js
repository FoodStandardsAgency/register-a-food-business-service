require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const { NOTIFY_TEMPLATE_ID_TEST } = require("../../src/config");
const invalidTemplateId = "1a1aaa-11aa-11a1-111a-Z11111a11a19";
const validRecipientEmail = "fsatestemail.valid@gmail.com";
const invalidRecipientEmail = "not-in-an-email-format";
const testRegistration = {
  establishment: {
    establishment_details: {
      establishment_trading_name: "Itsu",
      test_variable: "example"
    },
    operator: {
      operator_first_name: "Fred"
    },
    premise: {
      establishment_postcode: "SW12 9RQ"
    },
    activities: {
      customer_type: "End consumer"
    }
  },
  metadata: {
    declaration1: "Declaration"
  }
};
const testPostRegistrationMetadata = { example: "test" };

describe("Notify contract: sendSingleEmail", () => {
  describe("When given valid request", () => {
    const notifyArguments = [
      NOTIFY_TEMPLATE_ID_TEST,
      validRecipientEmail,
      testRegistration,
      testPostRegistrationMetadata
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
      testRegistration,
      testPostRegistrationMetadata
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
      testRegistration,
      testPostRegistrationMetadata
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
      {},
      {}
    ];

    it("Should both reject", async () => {
      process.env.DOUBLE_MODE = true;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
      process.env.DOUBLE_MODE = false;
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
