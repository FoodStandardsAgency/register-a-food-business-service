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
  sendFboEmail: jest.fn()
}));

const {
  saveRegistration,
  getFullRegistrationById,
  getRegistrationMetaData,
  sendTascomiRegistration,
  sendFboEmail
} = require("./registration.service");
const { validate } = require("../../services/validation.service");
const {
  createNewRegistration,
  getRegistration
} = require("./registration.controller");

describe("registration controller", () => {
  let result;

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
        sendFboEmail.mockImplementation(() => {
          return { email_success_fbo: true };
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
