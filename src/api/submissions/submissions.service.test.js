jest.mock("../../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));

jest.mock("../../connectors/configDb/configDb.connector", () => ({
  getAllLocalCouncilConfig: jest.fn()
}));

jest.mock("../../services/statusEmitter.service");

jest.mock("../../services/notifications.service");

jest.mock("axios");

jest.mock("../../services/pdf.service");

jest.mock("../../connectors/cacheDb/cacheDb.connector", () => ({
  updateStatusInCache: jest.fn()
}));

const {
  getAllLocalCouncilConfig
} = require("../../connectors/configDb/configDb.connector");

const mockLocalCouncilConfig = require("../../connectors/configDb/mockLocalCouncilConfig.json");

const axios = require("axios");

const {
  getRegistrationMetaData,
  getLcContactConfig,
  getLcAuth
} = require("./submissions.service");

let result;

describe("Function: getRegistrationMetaData: ", () => {
  let result;
  describe("When fsaRnResponse is 200 and NODE_ENV is not production", () => {
    beforeEach(async () => {
      process.env.NODE_ENV = "not production";
      axios.mockResolvedValue({
        status: 200,
        data: { "fsa-rn": "12345", reg_submission_date: "18/03/2018" }
      });
      result = await getRegistrationMetaData(1234);
    });

    // it("fetch should be called with the passed councilCode and a typeCode of 000", () => {
    //   expect(fetch).toHaveBeenLastCalledWith(
    //     "https://rng.food.gov.uk/generate/1234/000"
    //   );
    // });
    it("should return an object that contains fsa-rn", () => {
      expect(result["fsa-rn"]).toBeDefined();
    });
    it("should return an object that contains reg_submission_date", () => {
      expect(result.reg_submission_date).toBeDefined();
    });
  });

  describe("When fsaRnResponse is 200 and NODE_ENV is 'production'", () => {
    beforeEach(async () => {
      process.env.NODE_ENV = "production";
      axios.mockResolvedValue({
        status: 200,
        data: { "fsa-rn": "12345", reg_submission_date: "18/03/2018" }
      });
      result = await getRegistrationMetaData(1234);
    });
    // it("fetch should be called with the passed councilCode and a typeCode of 001", () => {
    //   expect(fetch).toHaveBeenLastCalledWith(
    //     "https://rng.food.gov.uk/generate/1234/001",
    //     {}
    //   );
    // });
    it("should return an object that contains fsa-rn", () => {
      expect(result["fsa-rn"]).toBeDefined();
    });
    it("should return an object that contains reg_submission_date", () => {
      expect(result.reg_submission_date).toBeDefined();
    });
  });

  describe("When fsaRnResponse is not 200", () => {
    beforeEach(async () => {
      axios.mockResolvedValue({
        status: 100,
        data: { "fsa-rn": undefined }
      });
      result = await getRegistrationMetaData();
    });
    it("should return an object that contains temporary fsa_rn", () => {
      expect(result["fsa-rn"]).toEqual(expect.stringMatching(/^tmp_/));
    });
  });

  describe("When the request to fsa-rn generator fails", () => {
    beforeEach(async () => {
      axios.mockImplementation(() => {
        throw new Error("test error");
      });
      try {
        result = await getRegistrationMetaData();
      } catch (err) {
        result = err;
      }
    });
    it("should return an object that contains temporary fsa_rn", () => {
      expect(result["fsa-rn"]).toEqual(expect.stringMatching(/^tmp_/));
    });
  });
});

describe("Function: getLcContactConfig: ", () => {
  beforeEach(() => {
    getAllLocalCouncilConfig.mockImplementation(() => mockLocalCouncilConfig);
  });

  describe("given a valid localCouncilUrl", () => {
    describe("given the local council does not have a separate standards council", () => {
      describe("given LC phone number exists", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("mid-and-east-antrim");
        });
        it("should return an object with a hygieneAndStandards key only", () => {
          expect(Object.keys(result)).toHaveLength(1);
          expect(result.hygieneAndStandards).toBeDefined();
        });

        it("the hygieneAndStandards object should contain the necessary data fields", () => {
          expect(result.hygieneAndStandards.code).toBeDefined();
          expect(result.hygieneAndStandards.local_council).toBeDefined();
          expect(
            result.hygieneAndStandards.local_council_notify_emails
          ).toBeDefined();
          expect(result.hygieneAndStandards.local_council_email).toBeDefined();
          expect(
            result.hygieneAndStandards.local_council_phone_number
          ).toBeDefined();
          expect(result.hygieneAndStandards.hasAuth).toBe(true);
        });
      });
      describe("given phone number does not exist", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("dorset");
        });
        it("the hygieneAndStandards object not contain the phone number field", () => {
          expect(
            result.hygieneAndStandards.local_council_phone_number
          ).not.toBeDefined();
        });
      });
      describe("given the local council have new_authority_name and new_authority_id", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("dorset");
        });
        it("the hygieneAndStandards object contain the new_authority_name field", () => {
          expect(result.hygieneAndStandards.new_authority_name).toBeDefined();
          expect(result.hygieneAndStandards.new_authority_name).toBe(
            "New name"
          );
        });
        it("the hygieneAndStandards object contain the new_authority_id field", () => {
          expect(result.hygieneAndStandards.new_authority_id).toBeDefined();
          expect(result.hygieneAndStandards.new_authority_id).toBe(1234);
        });
      });
      describe("given the local council have local_council_guidance_link", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("dorset");
        });
        it("the hygieneAndStandards object contain the local_council_guidance_link field", () => {
          expect(
            result.hygieneAndStandards.local_council_guidance_link
          ).toBeDefined();
          expect(result.hygieneAndStandards.local_council_guidance_link).toBe(
            "link2"
          );
        });
      });
    });

    describe("given the local council has a separate standards council", () => {
      describe("given hygiene LC phone number exists and standards phone number does not", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("west-dorset");
        });

        it("should return an object with a hygiene key and a standards key", () => {
          expect(Object.keys(result)).toHaveLength(2);
          expect(result.hygiene).toBeDefined();
          expect(result.standards).toBeDefined();
        });

        it("each nested object should contain the necessary data fields", () => {
          for (let typeOfCouncil in result) {
            expect(result[typeOfCouncil].code).toBeDefined();
            expect(result[typeOfCouncil].local_council).toBeDefined();
            expect(
              result[typeOfCouncil].local_council_notify_emails
            ).toBeDefined();
            expect(result[typeOfCouncil].local_council_email).toBeDefined();
          }
          expect(result.hygiene.local_council_phone_number).toBeDefined();
          expect(result.standards.local_council_phone_number).not.toBeDefined();
        });
      });
      describe("given hygiene LC phone number does not exist and standards phone number exists", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("example-no-phone-number");
        });

        it("should return an object with a hygiene key and a standards key", () => {
          expect(Object.keys(result)).toHaveLength(2);
          expect(result.hygiene).toBeDefined();
          expect(result.standards).toBeDefined();
        });

        it("each nested object should contain the necessary data fields", () => {
          for (let typeOfCouncil in result) {
            expect(result[typeOfCouncil].code).toBeDefined();
            expect(result[typeOfCouncil].local_council).toBeDefined();
            expect(
              result[typeOfCouncil].local_council_notify_emails
            ).toBeDefined();
            expect(result[typeOfCouncil].local_council_email).toBeDefined();
          }
          expect(result.hygiene.local_council_phone_number).not.toBeDefined();
          expect(result.standards.local_council_phone_number).toBeDefined();
        });
      });
      describe("given the local council have new_authority_name and new_authority_id", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("west-dorset");
        });
        it("the hygiene object contain the new_authority_name field", () => {
          expect(result.hygiene.new_authority_name).toBeDefined();
          expect(result.hygiene.new_authority_name).toBe("New name");
        });
        it("the hygiene object contain the new_authority_id field", () => {
          expect(result.hygiene.new_authority_id).toBeDefined();
          expect(result.hygiene.new_authority_id).toBe(1234);
        });
        it("the standards object contain the new_authority_name field", () => {
          expect(result.standards.new_authority_name).toBeDefined();
          expect(result.standards.new_authority_name).toBe("New name");
        });
        it("the standards object contain the new_authority_id field", () => {
          expect(result.standards.new_authority_id).toBeDefined();
          expect(result.standards.new_authority_id).toBe(1234);
        });
      });
      describe("given the local council have local_council_guidance_link", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("west-dorset");
        });
        it("the hygiene object contain the local_council_guidance_link field", () => {
          expect(result.hygiene.local_council_guidance_link).toBeDefined();
          expect(result.hygiene.local_council_guidance_link).toBe("link1");
        });
        it("the standards object contain the local_council_guidance_link field", () => {
          expect(result.standards.local_council_guidance_link).toBeDefined();
          expect(result.standards.local_council_guidance_link).toBe("link2");
        });
      });
    });
  });

  describe("given a valid localCouncilUrl that specifies a non-existent standards council", () => {
    beforeEach(async () => {
      try {
        await getLcContactConfig("example-with-missing-standards-council");
      } catch (err) {
        result = err;
      }
    });

    it("should throw localCouncilNotFound error with the URL", () => {
      expect(result.name).toBe("localCouncilNotFound");
      expect(result.message).toBe(
        `A separate standards council config with the code "100000" was expected for "example-with-missing-standards-council" but does not exist`
      );
    });
  });

  describe("given an invalid localCouncilUrl", () => {
    beforeEach(async () => {
      try {
        await getLcContactConfig("some-invalid-local-council");
      } catch (err) {
        result = err;
      }
    });

    it("should throw localCouncilNotFound error with the URL", () => {
      expect(result.name).toBe("localCouncilNotFound");
      expect(result.message).toBe(
        `Config for "some-invalid-local-council" not found`
      );
    });
  });

  describe("given a missing localCouncilUrl", () => {
    beforeEach(async () => {
      try {
        await getLcContactConfig(undefined);
      } catch (err) {
        result = err;
      }
    });

    it("should throw localCouncilNotFound error with an explanation", () => {
      expect(result.name).toBe("localCouncilNotFound");
      expect(result.message).toBe("Local council URL is undefined");
    });
  });
});

describe("Function: getLcAuth: ", () => {
  beforeEach(() => {
    getAllLocalCouncilConfig.mockImplementation(() => mockLocalCouncilConfig);
  });

  describe("given a valid localCouncilUrl", () => {
    beforeEach(async () => {
      result = await getLcAuth("dorset");
    });

    it("Should return auth", () => {
      expect(result).toEqual({
        url: "url",
        public_key: "key",
        private_key: "key"
      });
    });
  });

  describe("given an invalid localCouncilUrl", () => {
    beforeEach(async () => {
      try {
        await getLcAuth("some-invalid-local-council");
      } catch (err) {
        result = err;
      }
    });

    it("should throw localCouncilNotFound error with the URL", () => {
      expect(result.name).toBe("localCouncilNotFound");
      expect(result.message).toBe(
        `Config for "some-invalid-local-council" not found`
      );
    });
  });

  describe("given a missing localCouncilUrl", () => {
    beforeEach(async () => {
      try {
        await getLcAuth(undefined);
      } catch (err) {
        result = err;
      }
    });

    it("should throw localCouncilNotFound error with an explanation", () => {
      expect(result.name).toBe("localCouncilNotFound");
      expect(result.message).toBe("Local council URL is undefined");
    });
  });
});
