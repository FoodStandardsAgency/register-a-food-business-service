const { NotifyClient } = require("notifications-node-client");
const { sendSingleEmail } = require("./notify.connector");
const { notifyClientDouble } = require("./notify.double");
const {
  updateNotificationOnCompleted
} = require("../cacheDb/cacheDb.connector");

jest.mock("notifications-node-client");
jest.mock("./notify.double");
jest.mock("../cacheDb/cacheDb.connector");

describe("Function: sendSingleEmail", () => {
  let mockNotifyClient;
  let mockCacheDbConnector;
  const testTemplateId = "123456";
  const testRecipient = "email@email.com";
  const testPdfFile = "example pdf file";
  const testFlattenedData = {
    example: "value",
    opening_day_monday: true,
    opening_day_tuesday: false
  };
  const testFetchedTemplate = {
    body: {
      personalisation: {
        some_field: {},
        example: {},
        example_exists: {},
        opening_day_monday_exists: {},
        opening_day_tuesday_exists: {}
      }
    }
  };

  const args = [testTemplateId, testRecipient, testFlattenedData, testPdfFile];

  describe("given the request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        }),
        getTemplateById: jest.fn(() => testFetchedTemplate),
        prepareUpload: jest.fn()
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
      mockCacheDbConnector = {
        updateNotificationOnCompleted: jest.fn()
      };
      updateNotificationOnCompleted.mockImplementation(
        () => mockCacheDbConnector.updateNotificationOnCompleted
      );
    });

    it("Should resolve with the success message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe(
        "This is a success message from the notify client"
      );
    });

    it("Should have called the Notify sendEmail function with the template ID, recipient, and flattenedData (within an object)", () => {
      return sendSingleEmail(...args).then(() => {
        const expectedFlattenedDataWithExists = {
          example: "value",
          example_exists: "yes",
          some_field: "",
          some_field_exists: "no",
          opening_day_monday: true,
          opening_day_monday_exists: "yes",
          opening_day_tuesday: "",
          opening_day_tuesday_exists: "no"
        };
        expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(
          testTemplateId,
          testRecipient,
          { personalisation: expectedFlattenedDataWithExists }
        );
        expect(updateNotificationOnCompleted).not.toHaveBeenCalled();
      });
    });
  });
  describe("given the request is successful with update cache", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        }),
        getTemplateById: jest.fn(() => testFetchedTemplate),
        prepareUpload: jest.fn()
      };
      mockCacheDbConnector = {
        updateNotificationOnCompleted: jest.fn()
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
      updateNotificationOnCompleted.mockImplementation(
        () => mockCacheDbConnector.updateNotificationOnCompleted
      );
    });
    it("Should update the notification status", async () => {
      return sendSingleEmail(...args, {
        type: "LC",
        "fsa-rn": "example"
      }).then(() =>
        expect(updateNotificationOnCompleted).toHaveBeenCalledWith(
          "example",
          "LC",
          testRecipient,
          "Success"
        )
      );
    });
  });

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
    beforeEach(() => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
    });
    describe("when the error is a missing key", () => {
      beforeEach(async () => {
        mockNotifyClient = {
          sendEmail: jest.fn(async () => {
            throw new Error("secretOrPrivateKey must have a value");
          }),
          prepareUpload: jest.fn(),
          getTemplateById: jest.fn(() => testFetchedTemplate)
        };
        NotifyClient.mockImplementation(() => mockNotifyClient);
      });
      it("Should reject with the error message", async () => {
        const response = new Error("Notify error");
        response.name = "notifyMissingKey";
        await expect(sendSingleEmail(...args)).rejects.toEqual(response);
      });
    });

    describe("when the error is an invalid template id", () => {
      let result;
      beforeEach(async () => {
        mockNotifyClient = {
          sendEmail: jest.fn(async () => {
            const error = new Error();
            error.statusCode = 400;
            error.error = {
              errors: [
                {
                  error: "ValidationError"
                }
              ]
            };
            error.message = "notify error";
            throw error;
          }),
          prepareUpload: jest.fn(),
          getTemplateById: jest.fn(() => testFetchedTemplate)
        };
        NotifyClient.mockImplementation(() => mockNotifyClient);
        try {
          await sendSingleEmail(...args);
        } catch (err) {
          result = err;
        }
      });
      it("Should throw notifyInvalidTemplate error", async () => {
        expect(result.name).toBe("notifyInvalidTemplate");
        expect(result.message).toBe("notify error");
      });
    });

    describe("when the error missing personalisation", () => {
      let result;
      beforeEach(async () => {
        mockNotifyClient = {
          sendEmail: jest.fn(async () => {
            const error = new Error();
            error.statusCode = 400;
            error.error = {
              errors: [
                {
                  error: "BadRequestError"
                }
              ]
            };
            error.message = "notify error";
            throw error;
          }),
          prepareUpload: jest.fn(),
          getTemplateById: jest.fn(() => testFetchedTemplate)
        };
        NotifyClient.mockImplementation(() => mockNotifyClient);
        try {
          await sendSingleEmail(...args);
        } catch (err) {
          result = err;
        }
      });
      it("Should throw notifyMissingPersonalisation error", async () => {
        expect(result.name).toBe("notifyMissingPersonalisation");
        expect(result.message).toBe("notify error");
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
      notifyClientDouble.prepareUpload.mockImplementation(() => {});
      notifyClientDouble.getTemplateById.mockImplementation(
        async () => testFetchedTemplate
      );
    });

    it("Should resolve with the double message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe("Double response");
    });
  });

  describe("When not given a pdfFile", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        }),
        getTemplateById: jest.fn(() => testFetchedTemplate),
        prepareUpload: jest.fn()
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
      args[3] = false;
    });

    it("Should resolve with the success message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe(
        "This is a success message from the notify client"
      );
    });
  });

  describe("given the request is throws error update cache", () => {
    beforeEach(async () => {
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          const error = new Error();
          error.statusCode = 400;
          error.error = {
            errors: [
              {
                error: "BadRequestError"
              }
            ]
          };
          error.message = "notify error";
          throw error;
        }),
        prepareUpload: jest.fn(),
        getTemplateById: jest.fn(() => testFetchedTemplate)
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
      let mockCacheDbConnectora = {
        updateNotificationOnCompleted: jest.fn()
      };
      updateNotificationOnCompleted.mockImplementation(
        () => mockCacheDbConnectora.updateNotificationOnCompleted
      );
      sendSingleEmail(...args, {
        type: "LC",
        "fsa-rn": "example"
      });
    });
    it("Should update the notification status", async () => {
      //expect(result).toBeDefined();
      expect(updateNotificationOnCompleted).toHaveBeenCalledWith(
        "example",
        "LC",
        testRecipient,
        "Failure"
      );
    });
  });
});
