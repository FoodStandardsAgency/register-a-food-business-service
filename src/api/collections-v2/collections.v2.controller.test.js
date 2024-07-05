jest.mock("../../connectors/registrationsDb/registrationsDb.connector", () => ({
  getAllRegistrationsByCouncils: jest.fn(),
  getUnifiedRegistrations: jest.fn(),
  getSingleRegistration: jest.fn(),
  updateRegistrationCollectedByCouncil: jest.fn()
}));
jest.mock("../../connectors/configDb/configDb.connector", () => ({
  getCouncilsForSupplier: jest.fn()
}));

jest.mock("../../services/collectionsTransform.service", () => ({
  transformRegForCollections: jest.fn()
}));

jest.mock("../../services/logging.service");
jest.mock("./collections.v2.service");

const { validateOptions } = require("../collections/collections.service");

const {
  getAllRegistrationsByCouncils,
  getSingleRegistration,
  getUnifiedRegistrations,
  updateRegistrationCollectedByCouncil
} = require("../../connectors/registrationsDb/registrationsDb.connector");

const {
  getRegistrationsByCouncil,
  getRegistration,
  getRegistrations,
  updateRegistration
} = require("./collections.v2.controller");
const { getCouncilsForSupplier } = require("../../connectors/configDb/configDb.connector");
const { transformRegForCollections } = require("../../services/collectionsTransform.service");

const localAuthorityOptions = {
  subscriber: "cardiff",
  requestedCouncils: ["cardiff"],
  new: "true",
  fields: [],
  before: "2000-01-06",
  after: "2000-01-01"
};

const nonLCSubscriberOptions = {
  subscriber: "northgate",
  requestedCouncils: ["cardiff", "bath"],
  new: "true",
  fields: [],
  before: "2000-01-06",
  after: "2000-01-01"
};

const nonLCSubscriberNoneRequestedOptions = {
  subscriber: "northgate",
  requestedCouncils: ["northgate"],
  new: "true",
  fields: [],
  before: "2000-01-06",
  after: "2000-01-01"
};

const fullRegistration = {
  "fsa-rn": "PQQK8Q-SN9N8C-4ADETF",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  createdAt: "2018-10-30T14:51:47.303Z",
  updatedAt: "2018-10-30T14:51:47.303Z",
  establishment: {
    establishment_trading_name: "Itsu",
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_secondary_number: "84345245",
    establishment_email: "django@email.com",
    operator: {
      operator_type: "SOLETRADER",
      operator_company_name: "name",
      operator_company_house_number: null,
      operator_charity_name: null,
      operator_charity_number: null,
      operator_first_name: "Fred",
      operator_last_name: "Bloggs",
      operator_address_line_1: "12",
      operator_address_line_2: "Pie Lane",
      operator_address_line_3: "Test",
      operator_postcode: "SW12 9RQ",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_secondary_number: null,
      operator_email: "operator@email.com",
      contact_representative_name: null,
      contact_representative_role: null,
      contact_representative_number: null,
      contact_representative_email: null
    },
    activities: {
      customer_type: "END_CONSUMER",
      business_type: "001",
      business_type_search_term: null,
      import_export_activities: "BOTH",
      water_supply: "PUBLIC",
      business_other_details: null,
      opening_days_irregular: null,
      opening_day_monday: true,
      opening_day_tuesday: true,
      opening_day_wednesday: true,
      opening_day_thursday: true,
      opening_day_friday: true,
      opening_day_saturday: true,
      opening_day_sunday: true,
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thursday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    },
    premise: {
      establishment_address_line_1: "12",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Test",
      establishment_town: "London",
      establishment_postcode: "SW12 9RQ",
      establishment_type: "DOMESTIC"
    }
  },
  declaration: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  },
  hygieneAndStandards: {
    local_council: "City of Cardiff Council"
  },
  local_council_url: "cardiff",
  source_council_id: 8015
};
const shortRegistration = {
  "fsa-rn": "PQQK8Q-SN9N8C-4ADETF",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  createdAt: "2018-10-30T14:51:47.303Z",
  updatedAt: "2018-10-30T14:51:47.303Z",
  establishment: {},
  declaration: {},
  hygieneAndStandards: {
    local_council: "City of Cardiff Council"
  },
  local_council_url: "cardiff",
  source_council_id: 8015
};
const transformedFullReg = {
  fsa_rn: "PQQK8Q-SN9N8C-4ADETF",
  council: "City of Cardiff Council",
  competent_authority_id: 8015,
  local_council_url: "cardiff",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  createdAt: "2018-10-30T14:51:47.303Z",
  updatedAt: "2018-10-30T14:51:47.303Z",
  establishment: {
    establishment_trading_name: "Itsu",
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_secondary_number: "84345245",
    establishment_email: "django@email.com",
    operator: {
      operator_type: "SOLETRADER",
      operator_company_name: "name",
      operator_company_house_number: null,
      operator_charity_name: null,
      operator_charity_number: null,
      operator_first_name: "Fred",
      operator_last_name: "Bloggs",
      operator_address_line_1: "12",
      operator_address_line_2: "Pie Lane",
      operator_address_line_3: "Test",
      operator_postcode: "SW12 9RQ",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_secondary_number: null,
      operator_email: "operator@email.com",
      contact_representative_name: null,
      contact_representative_role: null,
      contact_representative_number: null,
      contact_representative_email: null
    },
    activities: {
      customer_type: "END_CONSUMER",
      business_type: "001",
      business_type_search_term: null,
      import_export_activities: "BOTH",
      water_supply: "PUBLIC",
      business_other_details: null,
      opening_days_irregular: null,
      opening_day_monday: true,
      opening_day_tuesday: true,
      opening_day_wednesday: true,
      opening_day_thursday: true,
      opening_day_friday: true,
      opening_day_saturday: true,
      opening_day_sunday: true,
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thursday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    },
    premise: {
      establishment_address_line_1: "12",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Test",
      establishment_town: "London",
      establishment_postcode: "SW12 9RQ",
      establishment_type: "DOMESTIC"
    }
  },
  metadata: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  }
};
const transformedShortReg = {
  fsa_rn: "PQQK8Q-SN9N8C-4ADETF",
  council: "City of Cardiff Council",
  competent_authority_id: 8015,
  local_council_url: "cardiff",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  createdAt: "2018-10-30T14:51:47.303Z",
  updatedAt: "2018-10-30T14:51:47.303Z",
  establishment: {},
  metadata: {}
};

describe("registrations.v2.controller", () => {
  let result;
  describe("Function: getRegistrationsByCouncil", () => {
    describe("When given invalid getNewRegistrations option", () => {
      beforeEach(async () => {
        try {
          validateOptions.mockImplementation(() => false);
          await getRegistrationsByCouncil({
            getNewRegistrations: "not a boolean"
          });
        } catch (err) {
          result = err;
        }
      });

      it("should bubble up the error", () => {
        expect(result.name).toBe("optionsValidationError");
      });
    });
    describe("When successful", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => true);
        getAllRegistrationsByCouncils.mockImplementation(() => [shortRegistration]);
        transformRegForCollections.mockImplementation(() => transformedShortReg);
      });
      describe("When susbcriber is a local authority", () => {
        beforeEach(async () => {
          getCouncilsForSupplier.mockImplementation(() => []);
          result = await getRegistrationsByCouncil(localAuthorityOptions);
        });
        it("Should call getAllRegistrationsByCouncils", () => {
          expect(getAllRegistrationsByCouncils).toHaveBeenCalledWith(
            ["cardiff"],
            "true",
            [],
            "2000-01-06",
            "2000-01-01"
          );
        });
        it("should call transformRegForCollection", () => {
          expect(transformRegForCollections).toHaveBeenCalledWith(shortRegistration, "v2");
        });
        it("Should return the result of transformRegForCollection", () => {
          expect(result).toEqual([transformedShortReg]);
        });
      });
      describe("When susbcriber is not a local authority", () => {
        describe("When requested councils is populated", () => {
          beforeEach(async () => {
            getCouncilsForSupplier.mockImplementation(() => ["cardiff", "bath", "bristol"]);
            result = await getRegistrationsByCouncil(nonLCSubscriberOptions);
          });
          it("Should call getAllRegistrationsByCouncils", () => {
            expect(getAllRegistrationsByCouncils).toHaveBeenCalledWith(
              ["cardiff", "bath"],
              "true",
              [],
              "2000-01-06",
              "2000-01-01"
            );
          });
          it("should call transformRegForCollection", () => {
            expect(transformRegForCollections).toHaveBeenCalledWith(shortRegistration, "v2");
          });
          it("Should return the result of getAllRegistrationsByCouncils", () => {
            expect(result).toEqual([transformedShortReg]);
          });
        });
        describe("When requested councils is not populated", () => {
          beforeEach(async () => {
            getCouncilsForSupplier.mockImplementation(() => ["cardiff", "bath", "bristol"]);
            result = await getRegistrationsByCouncil(nonLCSubscriberNoneRequestedOptions);
          });
          it("Should call getAllRegistrationsByCouncils", () => {
            expect(getAllRegistrationsByCouncils).toHaveBeenCalledWith(
              ["cardiff", "bath", "bristol"],
              "true",
              [],
              "2000-01-06",
              "2000-01-01"
            );
          });
          it("should call transformRegForCollection", () => {
            expect(transformRegForCollections).toHaveBeenCalledWith(shortRegistration, "v2");
          });
          it("Should return the result of getAllRegistrationsByCouncils", () => {
            expect(result).toEqual([transformedShortReg]);
          });
        });
      });
    });
  });

  describe("Function: getRegistration", () => {
    describe("When given invalid option", () => {
      beforeEach(async () => {
        try {
          validateOptions.mockImplementation(() => false);
          await getRegistration({ fsa_rn: "not valid" });
        } catch (err) {
          result = err;
        }
      });

      it("should bubble up the error", () => {
        expect(result.name).toBe("optionsValidationError");
      });
    });

    describe("When successful", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => true);
        getSingleRegistration.mockImplementation(() => fullRegistration);
        transformRegForCollections.mockImplementation(() => transformedFullReg);
        result = await getRegistration({
          getNewRegistrations: "true",
          council: "cardiff"
        });
      });

      it("Should return the result of transformRegForCollection", () => {
        expect(result).toEqual(transformedFullReg);
      });
    });
  });

  describe("Function: updateRegistration", () => {
    describe("When given invalid collected option", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => false);
        try {
          await updateRegistration({ collected: "true" });
        } catch (err) {
          result = err;
        }
      });

      it("should bubble up the error", () => {
        expect(result.name).toBe("optionsValidationError");
      });
    });

    describe("When successful", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => true);
        updateRegistrationCollectedByCouncil.mockImplementation(() => ({
          fsa_rn: "5768",
          collected: true
        }));
        result = await updateRegistration({
          collected: true,
          fsa_rn: "5768"
        });
      });
      it("Should return the response of updateRegistrationCollected", () => {
        expect(result).toEqual({ fsa_rn: "5768", collected: true });
      });
    });
  });

  describe("Function: getRegistrations", () => {
    describe("When given invalid option", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => false);
        try {
          await getRegistrations({ before: "true" });
        } catch (err) {
          result = err;
        }
      });

      it("should bubble up the error", () => {
        expect(result.name).toBe("optionsValidationError");
      });
    });

    describe("When successful", () => {
      beforeEach(async () => {
        validateOptions.mockImplementation(() => true);
        getUnifiedRegistrations.mockImplementation(() => [fullRegistration]);
        transformRegForCollections.mockImplementation(() => transformedFullReg);
        result = await getRegistrations({
          before: "2019-01-01",
          after: "2019-02-01"
        });
      });
      it("Should return the response", () => {
        expect(result).toEqual([transformedFullReg]);
      });
    });
  });
});
