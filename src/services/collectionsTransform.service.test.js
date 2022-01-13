const {
  transformRegForCollections
} = require("./collectionsTransform.service");

const fullRegistration = {
  "fsa-rn": "PQQK8Q-SN9N8C-4ADETF",
  collected: false,
  collected_at: null,
  reg_submission_date: new Date("2018-10-30T14:51:47.303Z"),
  establishment: {
    establishment_details: {
      establishment_trading_name: "Itsu",
      establishment_opening_date: "2018-06-07",
      establishment_primary_number: "329857245",
      establishment_secondary_number: "",
      establishment_email: "django@email.com",
      establishment_web_address: "test.com",
    },
    operator: {
      operator_type: "SOLETRADER",
      operator_company_name: "name",
      operator_companies_house_number: null,
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
      opening_day_sunday: false,
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thursday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: null
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
  collected: true,
  collected_at: new Date("2018-10-30T14:51:47.303Z"),
  reg_submission_date: new Date("2018-10-30T14:51:47.303Z"),
  hygieneAndStandards: {
    local_council: "City of Cardiff Council"
  },
  local_council_url: "cardiff",
  source_council_id: 8015
};
const transformedShortReg = {
  fsa_rn: "PQQK8Q-SN9N8C-4ADETF",
  council: "City of Cardiff Council",
  competent_authority_id: 8015,
  local_council_url: "cardiff",
  collected: true,
  collected_at: "2018-10-30T14:51:47.303Z",
  createdAt: "2018-10-30T14:51:47.303Z",
  updatedAt: "2018-10-30T14:51:47.303Z",
  establishment: {},
  metadata: {}
};
let result;

describe("Function: transformRegistration", () => {
  beforeEach(() => {
    result = transformRegForCollections(shortRegistration);
  });
  describe("given a registration with establishment and metadata supplied", () => {
    beforeEach(() => {
      result = transformRegForCollections(fullRegistration);
    });
    it("should return the establishment object with the correct structure", () => {
      expect(result.establishment.establishment_details).not.toBeDefined();
      expect(result.establishment.operator).toBeDefined();
      expect(result.establishment.activities).toBeDefined();
      expect(result.establishment.premise).toBeDefined();
    });
    it("should populate add first_line, street and dependent_locality fields", () => {
      expect(result.establishment.operator.operator_first_line).toBe(
        result.establishment.operator.operator_address_line_1
      );
      expect(result.establishment.operator.operator_street).toBe(
        result.establishment.operator.operator_address_line_2
      );
      expect(result.establishment.operator.operator_dependent_locality).toBe(
        result.establishment.operator.operator_address_line_3
      );
      expect(result.establishment.premise.establishment_first_line).toBe(
        result.establishment.premise.establishment_address_line_1
      );
      expect(result.establishment.premise.establishment_street).toBe(
        result.establishment.premise.establishment_address_line_2
      );
      expect(
        result.establishment.premise.establishment_dependent_locality
      ).toBe(result.establishment.premise.establishment_address_line_3);
    });
    it("should return metadata unchanged", () => {
      expect(result.metadata).toBe(fullRegistration.declaration);
    });
    it("should return supplied establishment fields populated and the rest as null", () => {
      const fields = Object.keys(fullRegistration.establishment.premise);
      fields.forEach((field) => {
        fullRegistration.establishment.premise[field]
          ? expect(result.establishment.premise[field]).toBe(
              fullRegistration.establishment.premise[field]
            )
          : expect(result.establishment.premise[field]).toBeNull();
      });
    });
  });
  describe("given partners isn't populated", () => {
    beforeEach(() => {
      result = transformRegForCollections(fullRegistration);
    });
    it("should return an empty array", () => {
      expect(result.establishment.operator.partners).toStrictEqual([]);
    });
  });
  describe("given opening days are false", () => {
    beforeEach(() => {
      result = transformRegForCollections(fullRegistration);
    });
    it("should return the opening days as false, not null", () => {
      expect(result.establishment.activities.opening_day_sunday).toStrictEqual(
        false
      );
    });
  });
  describe("given a registration without establishment or metadata supplied", () => {
    beforeEach(() => {
      result = transformRegForCollections(shortRegistration);
    });
    it("should return empty establishment and metadata objects", () => {
      expect(result.establishment).toEqual({});
      expect(result.metadata).toEqual({});
    });
  });
  describe("given there is a seperate standards council", () => {
    beforeEach(() => {
      shortRegistration.hygiene = {};
      shortRegistration.hygiene.local_council = "West Dorset Council";
      result = transformRegForCollections(shortRegistration);
    });
    afterEach(() => {
      delete shortRegistration.hygiene;
    });
    it("should populate council from hygiene.local_council", () => {
      expect(result.council).toBe(shortRegistration.hygiene.local_council);
    });
  });
  describe("given there is not a seperate standards council", () => {
    beforeEach(() => {
      result = transformRegForCollections(shortRegistration);
    });
    it("should populate council from hygieneAndStandards.local_council", () => {
      expect(result.council).toBe(
        shortRegistration.hygieneAndStandards.local_council
      );
    });
  });
  describe("given collected_at is populated", () => {
    beforeEach(() => {
      result = transformRegForCollections(shortRegistration);
    });
    it("should convert it to an ISO String", () => {
      expect(result.collected_at).toBe("2018-10-30T14:51:47.303Z");
    });
  });
  describe("given the collected_at is null", () => {
    beforeEach(() => {
      result = transformRegForCollections(fullRegistration);
    });
    it("should stay null", () => {
      expect(result.collected_at).toBeNull();
    });
  });
  it("should return the transformed registration", () => {
    expect(result).toEqual(transformedShortReg);
  });
});
