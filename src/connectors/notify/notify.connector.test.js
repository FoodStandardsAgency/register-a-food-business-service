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
    beforeEach(() => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
    });
    describe("when the error is a missing key", () => {
      beforeEach(async () => {
        mockNotifyClient = {
          sendEmail: jest.fn(async () => {
            throw new Error("secretOrPrivateKey must have a value");
          })
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
          })
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
          })
        };
        NotifyClient.mockImplementation(() => mockNotifyClient);
        try {
          await sendSingleEmail(...args);
        } catch (err) {
          result = err;
        }
      });
      it("Should throw notifyInvalidTemplate error", async () => {
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
        contact_representative_email: "",
        contact_representative_email_exists: "no",
        contact_representative_name: "",
        contact_representative_name_exists: "no",
        contact_representative_number: "",
        contact_representative_number_exists: "no",
        contact_representative_role: "",
        contact_representative_role_exists: "no",
        customer_type: "End consumer",
        declaration1: "Declaration",
        establishment_email: "",
        establishment_email_exists: "no",
        establishment_opening_date: "",
        establishment_opening_date_exists: "no",
        establishment_postcode: "SW12 9RQ",
        establishment_primary_number: "",
        establishment_primary_number_exists: "no",
        establishment_secondary_number: "",
        establishment_secondary_number_exists: "no",
        establishment_street: "",
        establishment_street_exists: "no",
        establishment_town: "",
        establishment_town_exists: "no",
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        example: "metadata",
        operator_charity_name: "",
        operator_charity_name_exists: "no",
        operator_charity_number: "",
        operator_charity_number_exists: "no",
        operator_company_house_number: "",
        operator_company_house_number_exists: "no",
        operator_company_name: "",
        operator_company_name_exists: "no",
        operator_email: "",
        operator_email_exists: "no",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        operator_last_name: "",
        operator_last_name_exists: "no",
        operator_primary_number: "",
        operator_primary_number_exists: "no",
        operator_secondary_number: "",
        operator_secondary_number_exists: "no",
        operator_street: "",
        operator_street_exists: "no",
        operator_town: "",
        operator_town_exists: "no"
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
