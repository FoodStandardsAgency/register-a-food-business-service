jest.mock("request-promise-native");
jest.mock("./tascomi.double");
jest.mock("../../services/statusEmitter.service");
jest.mock("@slice-and-dice/fsa-rof", () => ({
  tascomiAuth: {
    generateSyncHash: jest.fn()
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
      operator_address_line_1: "335",
      operator_address_line_2: "Some St.",
      operator_address_line_3: "Locailty",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_email: "operator@email.com",
      operator_type: "Sole trader"
    },
    premise: {
      establishment_postcode: "SW12 9RQ",
      establishment_address_line_1: "123",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Locality",
      establishment_town: "London",
      establishment_type: "somewhere"
    },
    activities: {
      customer_type: "End consumer",
      water_supply: "Public",
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thurday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    }
  },
  declaration: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  }
};

const partnership_registration = {
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
      operator_address_line_1: "335",
      operator_address_line_2: "Some St.",
      operator_address_line_3: "Locality",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_email: "operator@email.com",
      operator_type: "Partnership",
      partners: [
        {
          partner_name: "Fred",
          partner_is_primary_contact: true
        },
        {
          partner_name: "Joe",
          partner_is_primary_contact: false
        }
      ]
    },
    premise: {
      establishment_postcode: "SW12 9RQ",
      establishment_address_line_1: "123",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Locality",
      establishment_town: "London",
      establishment_type: "somewhere"
    },
    activities: {
      customer_type: "End consumer",
      water_supply: "Public",
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thurday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    }
  },
  declaration: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  }
};

const postRegistrationMetadata = {
  reg_submission_date: 1,
  "fsa-rn": "AA1AAA-AA11AA-A1AAA1",
  hygiene_council_code: 1234
};

const auth = {
  url: "url",
  public_key: "key",
  private_key: "key"
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
      try {
        await createFoodBusinessRegistration(
          registration,
          postRegistrationMetadata,
          auth
        );
      } catch (err) {
        result = err;
      }
    });

    it("should throw the error", () => {
      expect(result.message).toBe("Request error");
    });
  });

  describe("When request throws a tascomi auth error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        const err = new Error("Request error");
        err.statusCode = 401;
        throw err;
      });
      try {
        await createFoodBusinessRegistration(
          registration,
          postRegistrationMetadata,
          auth
        );
      } catch (err) {
        result = err;
      }
    });

    it("Should throw the error", () => {
      expect(result.name).toBe("tascomiAuth");
    });
  });

  describe("When request is successful for a sole trader", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should return the response", () => {
      expect(result).toBe("request response");
    });
  });

  describe("When request is successful for a partnership", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      result = await createFoodBusinessRegistration(
        partnership_registration,
        postRegistrationMetadata,
        auth
      );
    });

    process.env.DOUBLE_MODE = false;
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
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.premise_domestic_premises).toBe("t");
    });
  });

  describe("When establishment_type is Mobile or moveable premises", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.premise.establishment_type =
        "Mobile or moveable premises";
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.premise_mobile_premises).toBe("t");
    });
  });

  describe("When import_export_activities is directly import", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.import_export_activities =
        "Directly import";
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.import_food).toBe("t");
    });
  });

  describe("When import_export_activities is directly export", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.import_export_activities =
        "Directly export";
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.export_food).toBe("t");
    });
  });

  describe("When import_export_activities is directly import and export", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.import_export_activities =
        "Directly import and export";
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(request.mock.calls[0][0].form.export_food).toBe("t");
      expect(request.mock.calls[0][0].form.import_food).toBe("t");
    });
  });

  describe("When opening_day_monday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_monday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_monday
      ).toBe("t");
    });
  });

  describe("When opening_day_tuesday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_tuesday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_tuesday
      ).toBe("t");
    });
  });

  describe("When opening_day_wednesday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_wednesday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_wednesday
      ).toBe("t");
    });
  });

  describe("When opening_day_thursday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_thursday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_thursday
      ).toBe("t");
    });
  });

  describe("When opening_day_friday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_friday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_friday
      ).toBe("t");
    });
  });

  describe("When opening_day_saturday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_saturday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_saturday
      ).toBe("t");
    });
  });

  describe("When opening_day_sunday is true", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = false;
      request.mockImplementation(() => {
        return "request response";
      });
      registration.establishment.activities.opening_day_sunday = true;
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
    });

    it("should call api with correct form data", () => {
      expect(
        request.mock.calls[0][0].form.premise_typical_trading_days_sunday
      ).toBe("t");
    });
  });

  describe("When running in double mode", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.DOUBLE_MODE = true;
      doubleRequest.mockImplementation(() => {
        return "doubleRequest response";
      });
      result = await createFoodBusinessRegistration(
        registration,
        postRegistrationMetadata,
        auth
      );
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
      try {
        await createReferenceNumber("35", auth);
      } catch (err) {
        result = err;
      }
    });

    it("Should throw the error", () => {
      expect(result.message).toBe("Request error");
    });
  });

  describe("When request throws a tascomi auth error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        const err = new Error("Request error");
        err.statusCode = 401;
        throw err;
      });
      try {
        await createReferenceNumber("35", auth);
      } catch (err) {
        result = err;
      }
    });

    it("Should throw the error", () => {
      expect(result.name).toBe("tascomiAuth");
    });
  });

  describe("When request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      request.mockImplementation(() => {
        return "request response";
      });
      result = await createReferenceNumber("35", auth);
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
