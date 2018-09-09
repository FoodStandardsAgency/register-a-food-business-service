jest.mock("../../connectors/registrationDb/registrationDb", () => ({
  createActivities: jest.fn(),
  createEstablishment: jest.fn(),
  createMetadata: jest.fn(),
  createOperator: jest.fn(),
  createPremise: jest.fn(),
  createRegistration: jest.fn(),
  getRegistrationById: jest.fn(),
  getRegistrationByFsaRn: jest.fn(),
  getEstablishmentByRegId: jest.fn(),
  getMetadataByRegId: jest.fn(),
  getOperatorByEstablishmentId: jest.fn(),
  getPremiseByEstablishmentId: jest.fn(),
  getActivitiesByEstablishmentId: jest.fn(),
  destroyRegistrationById: jest.fn(),
  destroyEstablishmentByRegId: jest.fn(),
  destroyMetadataByRegId: jest.fn(),
  destroyOperatorByEstablishmentId: jest.fn(),
  destroyPremiseByEstablishmentId: jest.fn(),
  destroyActivitiesByEstablishmentId: jest.fn()
}));

jest.mock("../../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));

jest.mock("../../connectors/tascomi/tascomi.connector", () => ({
  createFoodBusinessRegistration: jest.fn(),
  createReferenceNumber: jest.fn()
}));

jest.mock("../../connectors/configDb/configDb.connector", () => ({
  getAllLocalCouncilConfig: jest.fn(),
  addDeletedId: jest.fn()
}));

jest.mock("../../services/notifications.service");

jest.mock("../../config", () => ({
  NOTIFY_TEMPLATE_ID_FBO: "1234",
  NOTIFY_TEMPLATE_ID_LC: "5678"
}));

jest.mock("node-fetch");

const { sendSingleEmail } = require("../../connectors/notify/notify.connector");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const {
  getAllLocalCouncilConfig
} = require("../../connectors/configDb/configDb.connector");

const mockLocalCouncilConfig = require("../../connectors/configDb/mockLocalCouncilConfig.json");

const {
  transformDataForNotify
} = require("../../services/notifications.service");

const {
  NOTIFY_TEMPLATE_ID_FBO,
  NOTIFY_TEMPLATE_ID_LC
} = require("../../config");

const fetch = require("node-fetch");

const {
  createRegistration,
  createEstablishment,
  createOperator,
  createActivities,
  createPremise,
  createMetadata,
  getRegistrationByFsaRn,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId,
  destroyRegistrationById,
  destroyEstablishmentByRegId,
  destroyMetadataByRegId,
  destroyOperatorByEstablishmentId,
  destroyPremiseByEstablishmentId,
  destroyActivitiesByEstablishmentId
} = require("../../connectors/registrationDb/registrationDb");

const {
  saveRegistration,
  getFullRegistrationByFsaRn,
  deleteRegistrationByFsaRn,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendEmailOfType,
  getLcContactConfig
} = require("./registration.service");

let result;

describe("Function: saveRegistration: ", () => {
  beforeEach(async () => {
    createRegistration.mockImplementation(() => {
      return { id: "435" };
    });
    createEstablishment.mockImplementation(() => {
      return { id: "225" };
    });
    createOperator.mockImplementation(() => {
      return { id: "123" };
    });
    createActivities.mockImplementation(() => {
      return { id: "562" };
    });
    createPremise.mockImplementation(() => {
      return { id: "495" };
    });
    createMetadata.mockImplementation(() => {
      return { id: "901" };
    });
    result = await saveRegistration({
      establishment: {
        establishment_details: {}
      }
    });
  });

  it("Should return the result of createRegistration", () => {
    expect(result).toEqual({
      regId: "435",
      establishmentId: "225",
      operatorId: "123",
      activitiesId: "562",
      premiseId: "495",
      metadataId: "901"
    });
  });

  // TODO JMB: add proper error case for this in handler.
  describe("Given one of the calls fails", () => {
    beforeEach(async () => {
      createMetadata.mockImplementation(() => {
        throw new Error();
      });

      try {
        result = await saveRegistration({
          establishment: {
            establishment_details: {}
          }
        });
      } catch (err) {
        result = err;
      }
    });

    it("Should throw an error", () => {
      expect(result.message).toBeDefined();
    });
  });
});

describe("Function: getFullRegistrationByFsaRn: ", () => {
  let result;

  describe("When getRegistrationByFsaRn is successful", () => {
    beforeEach(async () => {
      getRegistrationByFsaRn.mockImplementation(() => {
        return { id: "1" };
      });
      getEstablishmentByRegId.mockImplementation(() => {
        return { id: "1" };
      });
      getMetadataByRegId.mockImplementation(() => {
        return "metadata";
      });
      getOperatorByEstablishmentId.mockImplementation(() => {
        return "operator";
      });
      getPremiseByEstablishmentId.mockImplementation(() => {
        return "premise";
      });
      getActivitiesByEstablishmentId.mockImplementation(() => {
        return "activities";
      });

      result = await getFullRegistrationByFsaRn();
    });

    it("Should return the result of the get functions", () => {
      expect(result).toEqual({
        registration: { id: "1" },
        establishment: { id: "1" },
        operator: "operator",
        activities: "activities",
        premise: "premise",
        metadata: "metadata"
      });
    });
  });

  describe("When getRegistrationByFsaRn fails", () => {
    beforeEach(async () => {
      getRegistrationByFsaRn.mockImplementation(() => null);

      result = await getFullRegistrationByFsaRn("987");
    });

    it("Should return string", () => {
      expect(result).toEqual("No registration found for fsa_rn: 987");
    });
  });
});

describe("Function: deleteRegistrationByFsaRn: ", () => {
  let result;

  describe("When getRegistrationByFsaRn is successul", () => {
    beforeEach(async () => {
      getRegistrationByFsaRn.mockImplementation(() => ({
        id: 1
      }));
      destroyRegistrationById.mockImplementation(() => {
        return "";
      });
      destroyEstablishmentByRegId.mockImplementation(() => {
        return "";
      });
      destroyMetadataByRegId.mockImplementation(() => {
        return "";
      });
      destroyOperatorByEstablishmentId.mockImplementation(() => {
        return "";
      });
      destroyPremiseByEstablishmentId.mockImplementation(() => {
        return "";
      });
      destroyActivitiesByEstablishmentId.mockImplementation(() => {
        return "";
      });

      result = await deleteRegistrationByFsaRn();
    });

    it("Should return string when all destroy functions are successful", () => {
      expect(result).toEqual("Registration succesfully deleted");
    });
  });

  describe("When getRegistrationByFsaRn fails", () => {
    beforeEach(async () => {
      getRegistrationByFsaRn.mockImplementation(() => null);

      result = await deleteRegistrationByFsaRn("678");
    });

    it("Should return string", () => {
      expect(result).toEqual("No registration found for fsa_rn: 678");
    });
  });
});

describe("Function: sendTascomiRegistration: ", () => {
  let result;
  describe("When calls are successful", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      createFoodBusinessRegistration.mockImplementation(() => '{ "id": "123"}');
      createReferenceNumber.mockImplementation(
        () => '{ "id": "123", "online_reference": "0000123"}'
      );
      result = await sendTascomiRegistration();
    });

    it("should call createFoodBusinessRegistration", () => {
      expect(createFoodBusinessRegistration).toBeCalled();
    });

    it("should call createReferenceNumber with result of previous call", () => {
      expect(createReferenceNumber).toBeCalledWith("123");
    });

    it("should return response of createReferenceNumber", () => {
      expect(result).toBe('{ "id": "123", "online_reference": "0000123"}');
    });
  });

  describe("When createReferenceNumber fails", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      createFoodBusinessRegistration.mockImplementation(() => '{ "id": "123"}');
      createReferenceNumber.mockImplementation(() => '{ "id": 0 }');
      try {
        await sendTascomiRegistration();
      } catch (err) {
        result = err;
      }
    });

    it("Should throw tascomiRefNumber error", () => {
      expect(result.name).toBe("tascomiRefNumber");
    });
  });
});

describe("Function: getRegistrationMetaData: ", () => {
  let result;
  describe("When fsaRnResponse is 200 and NODE_ENV is not production", () => {
    beforeEach(async () => {
      process.env.NODE_ENV = "not production";
      fetch.mockImplementation(() => ({
        status: 200,
        json: () => ({ "fsa-rn": "12345", reg_submission_date: "18/03/2018" })
      }));
      result = await getRegistrationMetaData(1234);
    });
    it("fetch should be called with the passed councilCode and a typeCode of 000", () => {
      expect(fetch).toHaveBeenLastCalledWith(
        "https://fsa-reference-numbers.epimorphics.net/generate/1234/000"
      );
    });
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
      fetch.mockImplementation(() => ({
        status: 200,
        json: () => ({ "fsa-rn": "12345", reg_submission_date: "18/03/2018" })
      }));
      result = await getRegistrationMetaData(1234);
    });
    it("fetch should be called with the passed councilCode and a typeCode of 001", () => {
      expect(fetch).toHaveBeenLastCalledWith(
        "https://fsa-reference-numbers.epimorphics.net/generate/1234/001"
      );
    });
    it("should return an object that contains fsa-rn", () => {
      expect(result["fsa-rn"]).toBeDefined();
    });
    it("should return an object that contains reg_submission_date", () => {
      expect(result.reg_submission_date).toBeDefined();
    });
  });

  describe("When fsaRnResponse is not 200", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => ({
        status: 100,
        json: () => ({ "fsa-rn": undefined })
      }));
      result = await getRegistrationMetaData();
    });
    it("should return an object that contains fsa_rn", () => {
      expect(result["fsa-rn"]).toBe(undefined);
    });
  });

  describe("When the request to fsa-rn generator fails", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => {
        throw new Error("test error");
      });
      try {
        result = await getRegistrationMetaData();
      } catch (err) {
        result = err;
      }
    });
    it("should throw the error from the fetch attempt", () => {
      expect(result.message).toBe("test error");
    });
  });
});

describe("Function: sendEmailOfType: ", () => {
  beforeEach(() => {
    transformDataForNotify.mockImplementation(() => testTransformedData);
  });

  let result;

  const testRecipient = "recipient@example.com";

  const testRegistration = {
    local_council: "example@example.com"
  };

  const testPostRegistrationMetadata = {
    example: "metadata"
  };

  const testlcContactConfig = {
    local_council_email: "example@example.com"
  };

  const testTransformedData = {
    example: "value"
  };

  describe("When the connector responds successfully", () => {
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => ({
        id: "123-456"
      }));
      result = await sendEmailOfType(
        "LC",
        testRegistration,
        testPostRegistrationMetadata,
        testlcContactConfig,
        testRecipient
      );
    });

    it("should have called the connector with the correct arguments", () => {
      expect(sendSingleEmail).toHaveBeenLastCalledWith(
        NOTIFY_TEMPLATE_ID_LC,
        testRecipient,
        testTransformedData
      );
    });

    it("should return an object with success value true and the correct recipient email", () => {
      expect(result.success).toBe(true);
      expect(result.recipient).toBe(testRecipient);
    });
  });

  describe("When the connector throws an error", () => {
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => {
        throw new Error();
      });
      result = await sendEmailOfType(
        "LC",
        testRegistration,
        testPostRegistrationMetadata,
        testlcContactConfig,
        testRecipient
      );
    });

    it("should return an object with success value false and still return a recipient", () => {
      expect(result.success).toBe(false);
      expect(result.recipient).toBe(testRecipient);
    });
  });

  describe("When called with typeOfEmail FBO", () => {
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => ({
        id: "123-456"
      }));
      result = await sendEmailOfType(
        "FBO",
        testRegistration,
        testPostRegistrationMetadata,
        testlcContactConfig,
        testRecipient
      );
    });

    it("should have called the connector with the correct arguments", () => {
      expect(sendSingleEmail).toHaveBeenLastCalledWith(
        NOTIFY_TEMPLATE_ID_FBO,
        testRecipient,
        testTransformedData
      );
    });

    it("should return an object with success value true and the correct recipient email", () => {
      expect(result.success).toBe(true);
      expect(result.recipient).toBe(testRecipient);
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
          expect(Object.keys(result).length).toBe(1);
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
    });

    describe("given the local council has a separate standards council", () => {
      describe("given hygiene LC phone number exists and standards phone number does not", () => {
        beforeEach(async () => {
          result = await getLcContactConfig("west-dorset");
        });

        it("should return an object with a hygiene key and a standards key", () => {
          expect(Object.keys(result).length).toBe(2);
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
          expect(Object.keys(result).length).toBe(2);
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
