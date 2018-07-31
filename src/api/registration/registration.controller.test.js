jest.mock("../../services/validation.service", () => ({
  validate: jest.fn()
}));

jest.mock("./registration.service", () => ({
  saveRegistration: jest.fn(),
  getFullRegistrationById: jest.fn()
}));

jest.mock("node-fetch");
const fetch = require("node-fetch");

const {
  saveRegistration,
  getFullRegistrationById
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
        saveRegistration.mockImplementation(() => {
          return { regId: 1 };
        });
        fetch.mockImplementation(() => ({
          status: "200",
          json: () => ({ fsa_rn: "12345" })
        }));
        result = await createNewRegistration("input");
      });

      it("should return the result of saveRegistration", () => {
        expect(result.regId).toBe(1);
      });
      it("should return an object that contains reg_submission_date", () => {
        expect(result.reg_submission_date).toBeDefined();
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

      it("should return the registration", () => {
        expect(result.message).toEqual('["ERROR"]');
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

    describe("When fsaRnResponse is 200", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        saveRegistration.mockImplementation(() => {
          return { regId: 1 };
        });
        fetch.mockImplementation(() => ({
          status: 200,
          json: () => ({ fsa_rn: "12345" })
        }));
        result = await createNewRegistration("input");
      });
      it("should return an object that contains fsa_rn", () => {
        expect(result.fsa_rn).toBeDefined();
      });
    });
    describe("When fsaRnResponse is not 200", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        saveRegistration.mockImplementation(() => {
          return { regId: 1 };
        });
        fetch.mockImplementation(() => ({
          status: 100,
          json: () => ({ fsa_rn: undefined })
        }));
        result = await createNewRegistration("input");
      });
      it("should return an object that contains fsa_rn", () => {
        expect(result.fsa_rn).toBe(undefined);
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
