jest.mock("request-promise-native");
jest.mock("./tascomi.double");
jest.mock("@slice-and-dice/fsa-rof", () => ({
  tascomiAuth: {
    generateSyncHash: jest.fn()
  }
}));
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));
const { tascomiAuth } = require("@slice-and-dice/fsa-rof");
tascomiAuth.generateSyncHash.mockImplementation(() => ({
  auth: "some auth",
  hash: "a hash"
}));
const request = require("request-promise-native");
const { doubleRequest } = require("./tascomi.double");

const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("./tascomi.connector");

const registration = {
  establishment: {
    establishment_details: {
      establishment_trading_name: "Itsu",
      establishment_primary_number: "329857245",
      establishment_secondary_number: "84345245",
      establishment_email: "django@uk.ibm.com",
      establishment_opening_date: "2018-06-07"
    },
    operator: {
      operator_first_name: "Fred",
      operator_last_name: "Bloggs",
      operator_postcode: "SW12 9RQ",
      operator_first_line: "335",
      operator_street: "Some St.",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_email: "operator@email.com",
      operator_type: "Sole trader"
    },
    premise: {
      establishment_postcode: "SW12 9RQ",
      establishment_first_line: "123",
      establishment_street: "Street",
      establishment_town: "London",
      establishment_type: "somewhere"
    },
    activities: {
      customer_type: "End consumer"
    }
  },
  metadata: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  }
};

describe("Function: createFoodBusinessRegistration", () => {
  let result;
  describe("When request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        throw new Error("Request error");
      });
      result = await createFoodBusinessRegistration(registration);
    });

    it("should return the error", () => {
      expect(result.message).toBe("Request error");
    });
  });

  describe("When request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      result = await createFoodBusinessRegistration(registration);
    });

    it("should return the response", () => {
      expect(result).toBe("request response");
    });
  });

  describe("When establishment_type is home or domestic premises", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.premise.establishment_type =
        "Home or domestic premises";
      result = await createFoodBusinessRegistration(registration);
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.premise_domestic_premises).toBe("t");
    });
  });

  describe("When running in double mode", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = true;
      doubleRequest.mockImplementation(() => {
        return "doubleRequest response";
      });
      result = await createFoodBusinessRegistration(registration);
    });
    it("should call double request", () => {
      expect(result).toBe("doubleRequest response");
    });
  });
});

describe("Function: createReferenceNumber", () => {
  let result;
  describe("When request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        throw new Error("Request error");
      });
      result = await createReferenceNumber("35");
    });

    it("Should return the error", () => {
      expect(result.message).toBe("Request error");
    });
  });

  describe("When request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        return "request response";
      });
      result = await createReferenceNumber("35");
    });

    it("Should return the response", () => {
      expect(result).toBe("request response");
    });

    it("Should call request with request data", () => {
      expect(request.mock.calls[0][0].form).toEqual({
        online_reference: "0000035"
      });
    });
  });
});
