jest.mock("../../services/validation.service", () => ({
  validate: jest.fn()
}));

jest.mock("./registration.service", () => ({
  saveRegistration: jest.fn(),
  getFullRegistrationByFsaRn: jest.fn(),
  deleteRegistrationByFsaRn: jest.fn(),
  sendTascomiRegistration: jest.fn(),
  getRegistrationMetaData: jest.fn(),
  getLcContactConfig: jest.fn(),
  getLcAuth: jest.fn()
}));

jest.mock("../../services/notifications.service", () => ({
  sendNotifications: jest.fn()
}));

jest.mock("../../connectors/cacheDb/cacheDb.connector", () => ({
  cacheRegistration: jest.fn(),
  updateCompletedInCache: jest.fn()
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
  getLcContactConfig,
  getLcAuth
} = require("./registration.service");
const { sendNotifications } = require("../../services/notifications.service");

const { validate } = require("../../services/validation.service");

const {
  cacheRegistration
} = require("../../connectors/cacheDb/cacheDb.connector");

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

  const postRegistrationMetadata = {
    reg_submission_date: 1,
    "fsa-rn": "AA1AAA-AA11AA-A1AAA1"
  };

  const testRegistration = {
    establishment: { operator: { operator_email: "operator@example.com" } }
  };
  const testLocalCouncilUrl = "example-council-url";
  const testRegDataVersion = "1.2.0";
  const testConfigVersion = {
    notify_template_keys: { key1: "abc", key2: "xyz" }
  };
  const mockSendResponse = jest.fn();
  describe("Function: createNewRegistration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    describe("when given valid data", () => {
      describe("when auth object exists", () => {
        beforeEach(async () => {
          getLcAuth.mockImplementation(() => {
            return {
              url: "https://notactualtascomiurl/01/test/123",
              public_key: "5353535535351",
              private_key: "123435353453"
            };
          });
          validate.mockImplementation(() => {
            return [];
          });
          getRegistrationMetaData.mockImplementation(() => {
            return postRegistrationMetadata;
          });
          getLcContactConfig.mockImplementation(() => exampleLcConfig);
          getConfigVersion.mockImplementation(() => testConfigVersion);
          result = await createNewRegistration(
            testRegistration,
            testLocalCouncilUrl,
            testRegDataVersion,
            mockSendResponse
          );
        });
        it("should call sendResponse with the result of getRegistrationMetaData", () => {
          expect(mockSendResponse.mock.calls[0][0].reg_submission_date).toBe(1);
        });
        it("should call sendTascomiRegistration with the registration and full postRegistrationMetadata", () => {
          expect(sendTascomiRegistration.mock.calls[0][1]).toEqual({
            reg_submission_date: 1,
            "fsa-rn": "AA1AAA-AA11AA-A1AAA1",
            hygiene_council_code: 1234
          });
        });

        it("should call sendNotifications", () => {
          expect(sendNotifications).toHaveBeenCalled();
        });

        it("should call saveRegistration", () => {
          expect(saveRegistration).toHaveBeenCalled();
        });
      });
      describe("when auth object does not exist", () => {
        beforeEach(async () => {
          getLcAuth.mockImplementation(() => {
            return undefined;
          });
          validate.mockImplementation(() => {
            return [];
          });
          getRegistrationMetaData.mockImplementation(() => {
            return postRegistrationMetadata;
          });
          getLcContactConfig.mockImplementation(() => exampleLcConfig);
          getConfigVersion.mockImplementation(() => testConfigVersion);
          result = await createNewRegistration(
            testRegistration,
            testLocalCouncilUrl,
            testRegDataVersion,
            mockSendResponse
          );
        });
        it("should call sendResponse with the result of getRegistrationMetaData", () => {
          expect(mockSendResponse.mock.calls[0][0].reg_submission_date).toBe(1);
        });
        it("should call cache registration", () => {
          expect(cacheRegistration).toHaveBeenCalled();
          const expectedToCache = Object.assign(
            {},
            {
              "fsa-rn": postRegistrationMetadata["fsa-rn"],
              reg_submission_date: postRegistrationMetadata.reg_submission_date
            },
            testRegistration,
            exampleLcConfig,
            {
              status: {
                registration: undefined,
                notifications: undefined
              }
            }
          );
          expect(cacheRegistration).toHaveBeenLastCalledWith(expectedToCache);
        });
        it("should not call sendTascomiRegistration", () => {
          expect(sendTascomiRegistration.mock.calls.length).toBe(0);
        });
        it("should call sendNotifications", () => {
          expect(sendNotifications).toHaveBeenCalled();
        });
        it("should call saveRegistration", () => {
          expect(saveRegistration).toHaveBeenCalled();
        });
      });
    });

    describe("given the Local Council is responsible for both hygiene and standards", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        getRegistrationMetaData.mockImplementation(() => {
          return postRegistrationMetadata;
        });
        getConfigVersion.mockImplementation(() => testConfigVersion);
        getLcContactConfig.mockImplementation(() => exampleLcConfig);
        result = await createNewRegistration(
          testRegistration,
          testLocalCouncilUrl,
          testRegDataVersion,
          mockSendResponse
        );
      });

      it("should call getRegistrationMetaData with the hygieneAndStandards council code response from getLcContactConfig", () => {
        expect(getRegistrationMetaData).toHaveBeenLastCalledWith(
          exampleLcConfig.hygieneAndStandards.code
        );
      });

      it("should call sendResponse wth a lc_config object with the response of getLcContactConfig", () => {
        expect(mockSendResponse.mock.calls[0][0].lc_config).toEqual(
          exampleLcConfig
        );
      });
    });

    describe("given the hygiene and standards Local Councils are separate", () => {
      beforeEach(async () => {
        validate.mockImplementation(() => {
          return [];
        });
        getRegistrationMetaData.mockImplementation(() => {
          return postRegistrationMetadata;
        });
        getConfigVersion.mockImplementation(() => testConfigVersion);
        getLcContactConfig.mockImplementation(() => exampleMultiLcConfig);
        result = await createNewRegistration(
          testRegistration,
          testLocalCouncilUrl,
          testRegDataVersion,
          mockSendResponse
        );
      });

      it("should call getRegistrationMetaData with the hygiene council code response from getLcContactConfig", () => {
        expect(getRegistrationMetaData).toHaveBeenLastCalledWith(
          exampleMultiLcConfig.hygiene.code
        );
      });

      it("should call sendResponse with a lc_config object with the response of getLcContactConfig", () => {
        expect(mockSendResponse.mock.calls[0][0].lc_config).toEqual(
          exampleMultiLcConfig
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

      it("should not cache the registration", () => {
        expect(cacheRegistration).not.toHaveBeenCalled();
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
