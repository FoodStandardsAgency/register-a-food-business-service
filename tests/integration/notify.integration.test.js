require("dotenv").config();
const {
  sendSingleEmail
} = require("../../src/connectors/notify/notify.connector");

const validTemplateId = "integration-test";
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

describe("Notify integration: sendSingleEmail", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });

  describe("When given a valid request", () => {
    const notifyArguments = [
      validTemplateId,
      validRecipientEmail,
      testRegistration,
      testPostRegistrationMetadata
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
      testRegistration,
      testPostRegistrationMetadata
    ];

    it("Should reject", async () => {
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

    it("Should reject", async () => {
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });

  describe("When missing required data", () => {
    const notifyArguments = [validTemplateId, validRecipientEmail, {}, {}];

    it("Should reject", async () => {
      await expect(sendSingleEmail(...notifyArguments)).rejects.toBeDefined();
    });
  });
});
