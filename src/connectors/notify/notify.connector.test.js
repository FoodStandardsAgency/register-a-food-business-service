const { NotifyClient } = require("notifications-node-client");
const { sendSingleEmail } = require("./notify.connector");
const { notifyClientDouble } = require("./notify.double");

jest.mock("notifications-node-client");
jest.mock("./notify.double");

describe("Function: sendSingleEmail", () => {
  let mockNotifyClient;
  const testTemplateId = "123456";
  const testRecipient = "email@email.com";
  const testFlattenedData = {
    example: "value"
  };
  const testFetchedTemplate = {
    body: {
      personalisation: {
        some_field: {},
        example: {}
      }
    }
  };

  const args = [testTemplateId, testRecipient, testFlattenedData];

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

  describe("given the request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        }),
        getTemplateById: jest.fn(() => testFetchedTemplate)
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
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
          some_field_exists: "no"
        };
        expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(
          testTemplateId,
          testRecipient,
          { personalisation: expectedFlattenedDataWithExists }
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
      notifyClientDouble.getTemplateById.mockImplementation(
        async () => testFetchedTemplate
      );
    });

    it("Should resolve with the double message", async () => {
      await expect(sendSingleEmail(...args)).resolves.toBe("Double response");
    });
  });
});
