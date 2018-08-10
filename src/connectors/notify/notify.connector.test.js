const { NotifyClient } = require("notifications-node-client");
const { sendSingleEmail } = require("./notify.connector");
const { notifyClientDouble } = require("./notify.double");

jest.mock("notifications-node-client");
jest.mock("./notify.double");

describe("Function: sendSingleEmail", () => {
  let mockNotifyClient;
  let testTemplateID = "1a1aaa-11aa-11a1-111a-111111a11a11";
  let testRecipient = "email@email.com";
  let testData = { example: "data" };

  describe("given request throws an error", () => {
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
      await expect(
        sendSingleEmail(testTemplateID, testRecipient, testData)
      ).rejects.toEqual(Error("This is an error thrown by the notify client"));
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
      await expect(
        sendSingleEmail(testTemplateID, testRecipient, testData)
      ).resolves.toBe("This is a success message from the notify client");
    });

    it("Should have called the sendEmail function with the template ID, recipient, and personalisation/data", () => {
      return sendSingleEmail(testTemplateID, testRecipient, testData).then(
        () => {
          expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(
            testTemplateID,
            testRecipient,
            { personalisation: testData }
          );
        }
      );
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
      await expect(
        sendSingleEmail(testTemplateID, testRecipient, testData)
      ).resolves.toBe("Double response");
    });
  });
});
