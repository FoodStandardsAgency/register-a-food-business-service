"use strict";

jest.mock("notifications-node-client");

const { NotifyClient } = require("notifications-node-client");
const { sendSingleEmail } = require("./notify.connector");

describe("Function: sendSingleEmail", () => {
  let mockNotifyClient;
  const testTemplateId = "123456";
  const testRecipient = "email@email.com";
  const testPdfFile = "example pdf file";
  const testFlattenedData = {
    example: "value",
    opening_day_monday: true,
    opening_day_tuesday: false,
    country: ""
  };
  const testFetchedTemplate = {
    data: {
      personalisation: {
        some_field: {},
        example: {},
        example_exists: {},
        opening_day_monday_exists: {},
        opening_day_tuesday_exists: {},
        country_exists: {}
      }
    }
  };

  const emailReplyToId = undefined;

  const args = [
    testTemplateId,
    testRecipient,
    emailReplyToId,
    testFlattenedData,
    testPdfFile,
    "FAKEFSAID-2343",
    "FAKETYPE",
    0
  ];

  describe("given the request is successful", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      mockNotifyClient = {
        sendEmail: jest.fn(async () => {
          return { body: "This is a success message from the notify client" };
        }),
        getTemplateById: jest.fn(() => testFetchedTemplate),
        prepareUpload: jest.fn()
      };
      NotifyClient.mockImplementation(() => mockNotifyClient);
    });

    it("Should resolve with the success message ", async () => {
      await expect(sendSingleEmail(testTemplateId, testRecipient, ...args)).resolves.toBe(
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
          opening_day_tuesday_exists: "no",
          country: "",
          country_exists: "no"
        };
        expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(testTemplateId, testRecipient, {
          personalisation: expectedFlattenedDataWithExists
        });
      });
    });

    it("Should have called the Notify sendEmail function with the reply email id", () => {
      const argsWithReplyEmailId = [
        testTemplateId,
        testRecipient,
        "1234567890",
        testFlattenedData,
        testPdfFile,
        "FAKEFSAID-2343",
        "FAKETYPE",
        0
      ];
      return sendSingleEmail(...argsWithReplyEmailId).then(() => {
        const expectedFlattenedDataWithExists = {
          example: "value",
          example_exists: "yes",
          some_field: "",
          some_field_exists: "no",
          opening_day_monday: true,
          opening_day_monday_exists: "yes",
          opening_day_tuesday: "",
          opening_day_tuesday_exists: "no",
          country: "",
          country_exists: "no"
        };
        expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(testTemplateId, testRecipient, {
          personalisation: expectedFlattenedDataWithExists,
          emailReplyToId: "1234567890"
        });
      });
    });

    describe("given the country of the LA", () => {
      const countries = ["england", "wales", "northern-ireland"];
      it.each(countries)("should set personalisation to match the country", (country) => {
        testFlattenedData.country = country;
        return sendSingleEmail(...args).then(() => {
          const expectedFlattenedDataWithExists = {
            example: "value",
            example_exists: "yes",
            some_field: "",
            some_field_exists: "no",
            opening_day_monday: true,
            opening_day_monday_exists: "yes",
            opening_day_tuesday: "",
            opening_day_tuesday_exists: "no",
            country: country,
            country_exists: "yes"
          };
          expectedFlattenedDataWithExists[`${country}`] = "yes";
          expect(mockNotifyClient.sendEmail).toHaveBeenLastCalledWith(
            testTemplateId,
            testRecipient,
            {
              personalisation: expectedFlattenedDataWithExists
            }
          );
        });
      });
    });

    describe("given the NotifyClient constructor throws an error when used", () => {
      beforeEach(async () => {
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
        jest.clearAllMocks();
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
          result = await sendSingleEmail(...args);
        });
        it("Should return null", async () => {
          expect(result).toBe(null);
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
          result = await sendSingleEmail(...args);
        });
        it("Should return null", async () => {
          expect(result).toBe(null);
        });
      });
      describe("when the error missing key", () => {
        let result;
        beforeEach(async () => {
          mockNotifyClient = {
            sendEmail: jest.fn(async () => {
              const error = new Error();
              error.statusCode = 300;
              error.error = {
                errors: [
                  {
                    error: "BadRequestError"
                  }
                ]
              };
              error.message = "secretOrPrivateKey must have a value";
              throw error;
            }),
            prepareUpload: jest.fn(),
            getTemplateById: jest.fn(() => testFetchedTemplate)
          };
          NotifyClient.mockImplementation(() => mockNotifyClient);
          result = await sendSingleEmail(...args);
        });
        it("Should return null", async () => {
          expect(result).toBe(null);
        });
      });
    });

    describe("When not given a pdfFile", () => {
      beforeEach(async () => {
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
  });
});
