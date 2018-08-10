jest.mock("../../connectors/registrationDb/registrationDb", () => ({
  createActivities: jest.fn(),
  createEstablishment: jest.fn(),
  createMetadata: jest.fn(),
  createOperator: jest.fn(),
  createPremise: jest.fn(),
  createRegistration: jest.fn(),
  getRegistrationById: jest.fn(),
  getEstablishmentByRegId: jest.fn(),
  getMetadataByRegId: jest.fn(),
  getOperatorByEstablishmentId: jest.fn(),
  getPremiseByEstablishmentId: jest.fn(),
  getActivitiesByEstablishmentId: jest.fn()
}));

jest.mock("../../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));

jest.mock("../../connectors/tascomi/tascomi.connector", () => ({
  createFoodBusinessRegistration: jest.fn(),
  createReferenceNumber: jest.fn()
}));

jest.mock("node-fetch");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../connectors/tascomi/tascomi.connector");

const { sendSingleEmail } = require("../../connectors/notify/notify.connector");

const { NOTIFY_TEMPLATE_ID_FBO } = require("../../config");

const fetch = require("node-fetch");

const {
  createRegistration,
  createEstablishment,
  createOperator,
  createActivities,
  createPremise,
  createMetadata,
  getRegistrationById,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId
} = require("../../connectors/registrationDb/registrationDb");

const {
  saveRegistration,
  getFullRegistrationById,
  sendTascomiRegistration,
  getRegistrationMetaData,
  sendFboEmail
} = require("./registration.service");

describe("Function: saveRegistration: ", () => {
  let result;
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
});

describe("Function: getFullRegistrationById: ", () => {
  let result;

  beforeEach(async () => {
    getRegistrationById.mockImplementation(() => {
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

    result = await getFullRegistrationById();
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

describe("Function: sendTascomiRegistration: ", () => {
  let result;

  beforeEach(async () => {
    jest.clearAllMocks();
    createFoodBusinessRegistration.mockImplementation(() => '{ "id": "123"}');

    createReferenceNumber.mockImplementation(() => "0000123");
    result = await sendTascomiRegistration();
  });

  it("should call createFoodBusinessRegistration", () => {
    expect(createFoodBusinessRegistration).toBeCalled();
  });

  it("should call createReferenceNumber with result of previous call", () => {
    expect(createReferenceNumber).toBeCalledWith("123");
  });

  it("should return response of createReferenceNumber", () => {
    expect(result).toBe("0000123");
  });
});

describe("Function: getRegistrationMetaData: ", () => {
  let result;
  describe("When fsaRnResponse is 200", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => ({
        status: 200,
        json: () => ({ "fsa-rn": "12345", reg_submission_date: "18/03/2018" })
      }));
      result = await getRegistrationMetaData();
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
});

describe("Function: sendFboEmail: ", () => {
  let result;
  const testRegistration = {
    establishment: { operator: { operator_email: "example@example.com" } }
  };

  const testRegistrationWithRepresentativeEmail = {
    establishment: {
      operator: { contact_representative_email: "example-rep@example.com" }
    }
  };

  const testPostRegistrationMetadata = {
    example: "metadata"
  };

  describe("When the connector responds successfully", () => {
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => ({
        id: "123-456"
      }));
    });

    describe("When operator_address is defined, but contact_representative_email is not", () => {
      beforeEach(async () => {
        result = await sendFboEmail(
          testRegistration,
          testPostRegistrationMetadata
        );
      });

      it("should return an object with success value true and the correct recipient email", () => {
        expect(result.email_fbo.success).toBe(true);
        expect(result.email_fbo.recipient).toBe("example@example.com");
      });

      it("should have called the connector with the correct arguments", () => {
        expect(sendSingleEmail).toHaveBeenLastCalledWith(
          NOTIFY_TEMPLATE_ID_FBO,
          "example@example.com",
          testRegistration,
          testPostRegistrationMetadata
        );
      });
    });

    describe("When contact_representative_email is defined, but operator_address is not", () => {
      beforeEach(async () => {
        result = await sendFboEmail(
          testRegistrationWithRepresentativeEmail,
          testPostRegistrationMetadata
        );
      });

      it("should return an object with success value true and the correct recipient email", () => {
        expect(result.email_fbo.success).toBe(true);
        expect(result.email_fbo.recipient).toBe("example-rep@example.com");
      });

      it("should have called the connector with the correct arguments", () => {
        expect(sendSingleEmail).toHaveBeenLastCalledWith(
          NOTIFY_TEMPLATE_ID_FBO,
          "example-rep@example.com",
          testRegistrationWithRepresentativeEmail,
          testPostRegistrationMetadata
        );
      });
    });
  });

  describe("When the connector throws an error", () => {
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => {
        throw new Error();
      });
      result = await sendFboEmail(
        testRegistration,
        testPostRegistrationMetadata
      );
    });

    it("should return an object with success value false", () => {
      expect(result.email_fbo.success).toBe(false);
    });
  });
});
