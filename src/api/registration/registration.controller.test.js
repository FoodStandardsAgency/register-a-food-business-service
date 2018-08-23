jest.mock("../../services/validation.service", () => ({
  validate: jest.fn()
}));

jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));

jest.mock("./registration.service", () => ({
  saveRegistration: jest.fn(),
  getFullRegistrationById: jest.fn(),
  sendTascomiRegistration: jest.fn(),
  getRegistrationMetaData: jest.fn(),
  sendFboEmail: jest.fn(),
  sendLcEmail: jest.fn(),
  getLcEmailConfig: jest.fn()
}));

const {
  saveRegistration,
  getFullRegistrationById,
  getRegistrationMetaData,
  sendTascomiRegistration,
  sendFboEmail,
  sendLcEmail,
  getLcEmailConfig
} = require("./registration.service");
const { validate } = require("../../services/validation.service");
const {
  createNewRegistration,
  getRegistration
} = require("./registration.controller");

describe("registration controller", () => {
  let result;
  const exampleLcConfig = {
    hygieneAndStandards: {
      code: 1234,
      lcName: "Example council name",
      lcNotificationEmails: ["example@example.com"],
      lcContactEmail: "example@example.com"
    }
  };

  describe("Function: createNewRegistration", () => {
    describe("when given valid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        sendTascomiRegistration.mockImplementation(
          () =>
            '{"accepted": "f", "ceased": "f", "declined": "f", "fsa_rn": "23589-DHF375"}'
        );
        saveRegistration.mockImplementation(() => {
          return { regId: 1 };
        });
        getRegistrationMetaData.mockImplementation(() => {
          return { reg_submission_date: 1 };
        });
        getLcEmailConfig.mockImplementation(() => exampleLcConfig);
        sendFboEmail.mockImplementation(() => {
          return true;
        });
        sendLcEmail.mockImplementation(() => {
          return true;
        });
        result = await createNewRegistration("input");
      });

      it("should return the result of saveRegistration", () => {
        expect(result.regId).toBe(1);
      });
      it("should return the result of getRegistrationMetaData", () => {
        expect(result.reg_submission_date).toBe(1);
      });
      it("should return the result of sendFboEmail", () => {
        expect(result.email_success_fbo).toBe(true);
      });

      describe("given the Local Council is responsible for both hygiene and standards", () => {
        beforeEach(async () => {
          getLcEmailConfig.mockImplementation(() => exampleLcConfig);
          result = await createNewRegistration("input");
        });

        it("should return email_success_lc as an object with hygieneAndStandards only", () => {
          expect(Object.keys(result.email_success_lc).length).toBe(1);
          expect(result.email_success_lc.hygieneAndStandards).toBe(true);
        });

        it("should return an lc_config object with the response of getLcEmailConfig", () => {
          expect(result.lc_config).toEqual(exampleLcConfig);
        });

        it("should have called sendFboEmail with single-LC data", () => {
          expect(sendFboEmail).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            {
              local_council: "Example council name",
              local_council_email: "example@example.com"
            }
          );
        });

        it("should have called sendLcEmail once with single-LC data", () => {
          expect(sendLcEmail).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            {
              local_council: "Example council name",
              local_council_email: "example@example.com"
            }
          );
        });
      });

      describe("given the hygiene and standards Local Councils are separate", () => {
        const exampleMultiLcConfig = {
          hygiene: {
            code: 1234,
            lcName: "Example council name",
            lcNotificationEmails: ["example@example.com"],
            lcContactEmail: "example@example.com"
          },
          standards: {
            code: 2345,
            lcName: "Another council name",
            lcNotificationEmails: ["another@example.com"],
            lcContactEmail: "another@example.com"
          }
        };

        beforeEach(async () => {
          getLcEmailConfig.mockImplementation(() => exampleMultiLcConfig);
          result = await createNewRegistration("input");
        });

        it("should return email_success_lc as an object with hygiene and standards objects", () => {
          expect(Object.keys(result.email_success_lc).length).toBe(2);
          expect(result.email_success_lc.hygiene).toBe(true);
          expect(result.email_success_lc.standards).toBe(true);
        });

        it("should return an lc_config object with the response of getLcEmailConfig", () => {
          expect(result.lc_config).toEqual(exampleMultiLcConfig);
        });

        it("should have called sendFboEmail with multi-LC data", () => {
          expect(sendFboEmail).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            {
              local_council_hygiene: "Example council name",
              local_council_hygiene_email: "example@example.com",
              local_council_standards: "Another council name",
              local_council_standards_email: "another@example.com"
            }
          );
        });

        it("should have called sendLcEmail TWICE with multi-LC data", async () => {
          sendLcEmail.mockClear();
          sendLcEmail.mockImplementation(() => {
            return true;
          });
          result = await createNewRegistration("input");

          expect(sendLcEmail).toHaveBeenCalledTimes(2);
          expect(sendLcEmail).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            {
              local_council_hygiene: "Example council name",
              local_council_hygiene_email: "example@example.com",
              local_council_standards: "Another council name",
              local_council_standards_email: "another@example.com"
            }
          );
        });
      });
    });

    describe("when given invalid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return ["ERROR"];
        });
        try {
          result = await createNewRegistration("input");
        } catch (err) {
          result = err;
        }
      });

      it("should throw a validation error", () => {
        expect(result.name).toEqual("validationError");
      });
    });

    describe("when given undefined", () => {
      it("Should throw an error", () => {
        try {
          createNewRegistration(undefined);
        } catch (err) {
          expect(err.message).toBeDefined();
        }
      });
    });
  });

  describe("Function: getRegistration", () => {
    describe("when given an id", () => {
      beforeEach(async () => {
        getFullRegistrationById.mockImplementation(() => {
          return "response";
        });
        result = await getRegistration();
      });

      it("should return the result of getFullRegistrationById", () => {
        expect(result).toEqual("response");
      });
    });
  });
});
