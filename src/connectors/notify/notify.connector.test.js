const { NotifyClient } = require("notifications-node-client");
const { sendSingleEmail } = require("./notify.connector");
const { notifyClientDouble } = require("./notify.double");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));
jest.mock("notifications-node-client");
jest.mock("./notify.double");

describe("Function: sendSingleEmail", () => {
  let mockNotifyClient;
  const testTemplateId = "123456";
  const testRecipient = "email@email.com";
  const testRegistration = {
    establishment: {
      establishment_details: {
        establishment_trading_name: "Itsu"
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
  const testPostRegistrationMetadata = { example: "metadata" };

  const args = [
    testTemplateId,
    testRecipient,
    testRegistration,
    testPostRegistrationMetadata
  ];

  describe("given the NotifyClient constructor throws an error when used", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      NotifyClient.mockImplementation(() => {
        throw new Error();
      });
    });

    it("Should reject with an error message", async () => {
      await expect(sendSingleEmail(...args)).rejects.toBeDefined();
    });
  });

  describe("given the request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          throw new Error("This is an error thrown by the notify client");
        })
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
    });

    it("Should reject with the error message", async () => {
      await expect(sendSingleEmail(...args)).rejects.toEqual(
        Error("This is an error thrown by the notify client")
      );
    });
  });

  describe("given the request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        })
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
    });

    it("Should resolve with the success message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe(
        "This is a success message from the notify client"
      );
    });

    it("Should have called the Notify sendEmail function with the template ID, recipient, and a flattened version of the personalisation/data", () => {
      const testFlattenedData = {
        establishment_trading_name: "Itsu",
        operator_first_name: "Fred",
        establishment_postcode: "SW12 9RQ",
        customer_type: "End consumer",
        declaration1: "Declaration",
        example: "metadata"
      };

      return sendSingleEmail(...args).then(() => {
        expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(
          testTemplateId,
          testRecipient,
          { personalisation: testFlattenedData }
        );
      });
    });
  });

  describe("When running in double mode", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = true;
      jest.clearAllMocks();
      NotifyClient.mockImplementation(() => ({}));
      notifyClientDouble.sendEmail.mockImplementation(async () => ({
        body: "Double response"
      }));
    });

    it("Should resolve with the double message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe("Double response");
    });
  });
});
