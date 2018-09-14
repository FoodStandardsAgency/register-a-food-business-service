const { transformDataForNotify } = require("./notifications.service");

jest.mock("./optional-notify-fields.json", () => [
  "establishment_trading_name",
  "operator_first_name",
  "example_optional_field"
]);

const testPostRegistrationMetadata = {
  example: "value"
};

const testLcContactConfigSplitWithPhoneNumber = {
  hygiene: {
    local_council: "Hygiene council name",
    local_council_email: "hygiene@example.com",
    local_council_phone_number: "123456789"
  },
  standards: {
    local_council: "Standards council name",
    local_council_email: "standards@example.com",
    local_council_phone_number: "123456789"
  }
};

const testLcContactConfigCombinedWithPhoneNumber = {
  hygieneAndStandards: {
    local_council: "Hygiene and standards council name",
    local_council_email: "both@example.com",
    local_council_phone_number: "123456789"
  }
};

const testLcContactConfigSplit = {
  hygiene: {
    local_council: "Hygiene council name",
    local_council_email: "hygiene@example.com"
  },
  standards: {
    local_council: "Standards council name",
    local_council_email: "standards@example.com"
  }
};

const testLcContactConfigCombined = {
  hygieneAndStandards: {
    local_council: "Hygiene and standards council name",
    local_council_email: "both@example.com"
  }
};

let testRegistrationData;

describe("Function: transformDataForNotify", () => {
  let result;

  beforeEach(() => {
    testRegistrationData = {
      establishment: {
        establishment_details: {
          establishment_trading_name: "Itsu",
          establishment_opening_date: "2017-12-30"
        },
        operator: {
          operator_first_name: "Fred"
        },
        premise: {
          establishment_postcode: "SW12 9RQ"
        },
        activities: {
          customer_type: "End consumer"
        }
      },
      metadata: {
        declaration1: "Declaration"
      }
    };
  });

  describe("given separate hygiene and standards councils with a phone number", () => {
    beforeEach(() => {
      result = transformDataForNotify(
        testRegistrationData,
        testPostRegistrationMetadata,
        testLcContactConfigSplitWithPhoneNumber
      );
    });

    it("should return the flattened data with two sets of council details", () => {
      const expectedFormat = {
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        establishment_postcode: "SW12 9RQ",
        establishment_opening_date: "30 Dec 2017",
        customer_type: "End consumer",
        declaration1: "Declaration",
        example: "value",
        local_council_hygiene: "Hygiene council name",
        local_council_email_hygiene: "hygiene@example.com",
        local_council_phone_number_hygiene: "123456789",
        local_council_standards: "Standards council name",
        local_council_email_standards: "standards@example.com",
        local_council_phone_number_standards: "123456789",
        example_optional_field: "",
        example_optional_field_exists: "no"
      };

      expect(result).toEqual(expectedFormat);
    });
  });

  describe("given a combined hygiene and standards councils with a phone number", () => {
    beforeEach(() => {
      result = transformDataForNotify(
        testRegistrationData,
        testPostRegistrationMetadata,
        testLcContactConfigCombinedWithPhoneNumber
      );
    });

    it("should return the flattened data with one set of council details", () => {
      const expectedFormat = {
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        establishment_postcode: "SW12 9RQ",
        establishment_opening_date: "30 Dec 2017",
        customer_type: "End consumer",
        declaration1: "Declaration",
        example: "value",
        local_council: "Hygiene and standards council name",
        local_council_email: "both@example.com",
        local_council_phone_number: "123456789",
        example_optional_field: "",
        example_optional_field_exists: "no"
      };

      expect(result).toEqual(expectedFormat);
    });
  });

  describe("given a combined hygiene and standards councils without a phone number", () => {
    beforeEach(() => {
      result = transformDataForNotify(
        testRegistrationData,
        testPostRegistrationMetadata,
        testLcContactConfigCombined
      );
    });

    it("should return the flattened data with one set of council details", () => {
      const expectedFormat = {
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        establishment_postcode: "SW12 9RQ",
        establishment_opening_date: "30 Dec 2017",
        customer_type: "End consumer",
        declaration1: "Declaration",
        example: "value",
        local_council: "Hygiene and standards council name",
        local_council_email: "both@example.com",
        example_optional_field: "",
        example_optional_field_exists: "no"
      };

      expect(result).toEqual(expectedFormat);
    });
  });

  describe("given separate hygiene and standards councils without a phone number", () => {
    beforeEach(() => {
      result = transformDataForNotify(
        testRegistrationData,
        testPostRegistrationMetadata,
        testLcContactConfigSplit
      );
    });

    it("should return the flattened data with two sets of council details", () => {
      const expectedFormat = {
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        establishment_postcode: "SW12 9RQ",
        establishment_opening_date: "30 Dec 2017",
        customer_type: "End consumer",
        declaration1: "Declaration",
        example: "value",
        local_council_hygiene: "Hygiene council name",
        local_council_email_hygiene: "hygiene@example.com",
        local_council_standards: "Standards council name",
        local_council_email_standards: "standards@example.com",
        example_optional_field: "",
        example_optional_field_exists: "no"
      };

      expect(result).toEqual(expectedFormat);
    });
  });
});
