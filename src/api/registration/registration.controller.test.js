jest.mock("../../services/validation.service", () => ({
  validate: jest.fn()
}));

jest.mock("./registration.service", () => ({
  saveRegistration: jest.fn(),
  getFullRegistrationByFsaRn: jest.fn(),
  deleteRegistrationByFsaRn: jest.fn(),
  sendTascomiRegistration: jest.fn(),
  getRegistrationMetaData: jest.fn(),
  sendEmailOfType: jest.fn(),
  getLcContactConfig: jest.fn()
}));

jest.mock("../../connectors/cacheDb/cacheDb.connector", () => ({
  cacheRegistration: jest.fn()
}));

jest.mock("../../connectors/configDb/configDb.connector", () => ({
  getConfigVersion: jest.fn()
}));

const {
  saveRegistration,
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  getRegistrationMetaData,
  sendTascomiRegistration,
  sendEmailOfType,
  getLcContactConfig
} = require("./registration.service");
const { validate } = require("../../services/validation.service");
const {
  createNewRegistration,
  getRegistration,
  deleteRegistration
} = require("./registration.controller");
const {
  getConfigVersion
} = require("../../connectors/configDb/configDb.connector");

describe("registration controller", () => {
  let result;
  const exampleLcConfig = {
    hygieneAndStandards: {
      code: 1234,
      local_council: "Example council name",
      local_council_notify_emails: ["example@example.com"],
      local_council_email: "example@example.com"
    }
  };

  const exampleMultiLcConfig = {
    hygiene: {
      code: 5678,
      local_council: "Example council name",
      local_council_notify_emails: ["example@example.com"],
      local_council_email: "example@example.com"
    },
    standards: {
      code: 2345,
      local_council: "Another council name",
      local_council_notify_emails: [
        "another@example.com",
        "alsothisone@example.com"
      ],
      local_council_email: "another@example.com"
    }
  };

  const testRegistration = {
    establishment: { operator: { operator_email: "operator@example.com" } }
  };
  const testRegistrationWithRepresentative = {
    establishment: {
      operator: { contact_representative_email: "representative@example.com" }
    }
  };
  const testLocalCouncilUrl = "example-council-url";
  const testRegDataVersion = "1.2.0";
  const testConfigVersion = {
    notify_template_keys: { key1: "abc", key2: "xyz" }
  };

  describe("Function: createNewRegistration", () => {
    describe("when given valid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        getRegistrationMetaData.mockImplementation(() => {
          return { reg_submission_date: 1, "fsa-rn": "AA1AAA-AA11AA-A1AAA1" };
        });
        sendTascomiRegistration.mockImplementation(
          () =>
            '{"accepted": "f", "ceased": "f", "declined": "f", "fsa_rn": "23589-DHF375"}'
        );
        saveRegistration.mockImplementation(() => {
          return { regId: 1 };
        });
        getLcContactConfig.mockImplementation(() => exampleLcConfig);
        getConfigVersion.mockImplementation(() => testConfigVersion);
        sendEmailOfType.mockImplementation(() => {
          return { success: true, recipient: "recipient@example.com" };
        });
        result = await createNewRegistration(
          testRegistration,
          testLocalCouncilUrl,
          testRegDataVersion
        );
      });

      it("should return the result of saveRegistration", () => {
        expect(result.regId).toBe(1);
      });
      it("should return the result of getRegistrationMetaData", () => {
        expect(result.reg_submission_date).toBe(1);
      });
      it("should call sendTascomiRegistration with the registration and full postRegistrationMetadata", () => {
        expect(sendTascomiRegistration.mock.calls[0][1]).toEqual({
          reg_submission_date: 1,
          "fsa-rn": "AA1AAA-AA11AA-A1AAA1",
          hygiene_council_code: 1234
        });
      });
      it("should return the result of sendEmailOfType", () => {
        expect(result.email_fbo).toEqual({
          recipient: "recipient@example.com",
          success: true
        });
      });

      describe("given the Local Council is responsible for both hygiene and standards", () => {
        beforeEach(async () => {
          getLcContactConfig.mockImplementation(() => exampleLcConfig);
          result = await createNewRegistration(
            testRegistration,
            testLocalCouncilUrl,
            testRegDataVersion
          );
        });

        it("should return email_lc as an object with hygieneAndStandards only", () => {
          expect(Object.keys(result.email_lc).length).toBe(1);
          expect(result.email_lc.hygieneAndStandards).toEqual({
            recipient: "recipient@example.com",
            success: true
          });
        });

        it("should call getRegistrationMetaData with the hygieneAndStandards council code response from getLcContactConfig", () => {
          expect(getRegistrationMetaData).toHaveBeenLastCalledWith(
            exampleLcConfig.hygieneAndStandards.code
          );
        });

        it("should return an lc_config object with the response of getLcContactConfig", () => {
          expect(result.lc_config).toEqual(exampleLcConfig);
        });
      });

      describe("given the hygiene and standards Local Councils are separate", () => {
        beforeEach(async () => {
          getLcContactConfig.mockImplementation(() => exampleMultiLcConfig);
          result = await createNewRegistration(
            testRegistration,
            testLocalCouncilUrl,
            testRegDataVersion
          );
        });

        it("should return email_lc as an object with hygiene and standards objects", () => {
          expect(Object.keys(result.email_lc).length).toBe(2);
          expect(result.email_lc.hygiene).toEqual({
            recipient: "recipient@example.com",
            success: true
          });
          expect(result.email_lc.standards).toEqual({
            recipient: "recipient@example.com",
            success: true
          });
        });

        it("should call getRegistrationMetaData with the hygiene council code response from getLcContactConfig", () => {
          expect(getRegistrationMetaData).toHaveBeenLastCalledWith(
            exampleMultiLcConfig.hygiene.code
          );
        });

        it("should return an lc_config object with the response of getLcContactConfig", () => {
          expect(result.lc_config).toEqual(exampleMultiLcConfig);
        });
      });
    });

    describe("given the operator_email field does not exist, but contact_representative_email does", () => {
      beforeEach(async () => {
        getLcContactConfig.mockImplementation(() => exampleLcConfig);

        result = await createNewRegistration(
          testRegistrationWithRepresentative,
          testLocalCouncilUrl,
          testRegDataVersion
        );
      });

      it("should have last called sendEmailOfType with the contact_representative_email", () => {
        expect(sendEmailOfType).toHaveBeenLastCalledWith(
          "FBO",
          expect.anything(),
          expect.anything(),
          expect.anything(),
          "representative@example.com",
          testConfigVersion.notify_template_keys
        );
      });
    });

    describe("when given invalid data", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return ["ERROR"];
        });
        try {
          result = await createNewRegistration(testRegistration);
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
        getFullRegistrationByFsaRn.mockImplementation(() => {
          return "response";
        });
        result = await getRegistration();
      });

      it("should return the result of getFullRegistrationById", () => {
        expect(result).toEqual("response");
      });
    });
  });

  describe("Function: deleteRegistration", () => {
    describe("when given an fsa_rn", () => {
      beforeEach(async () => {
        deleteRegistrationByFsaRn.mockImplementation(() => {
          return "response";
        });
        result = await deleteRegistration();
      });

      it("should return the result of deleteRegistrationById", () => {
        expect(result).toEqual("response");
      });
    });
  });
});
