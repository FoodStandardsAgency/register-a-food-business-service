const { transformDataForNotify } = require("./notifications.service");

jest.mock("./optional-notify-fields.json", () => [
  "establishment_trading_name",
  "operator_first_name",
  "example_optional_field"
]);

const testRegistrationData = {
  establishment: {
    establishment_details: {
      establishment_trading_name: "Itsu"
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

const testPostRegistrationMetadata = {
  example: "value"
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

describe("Function: transformDataForNotify", () => {
  let result;

  describe("given separate hygiene and standards councils", () => {
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

  describe("given separate hygiene and standards councils", () => {
    beforeEach(() => {
      result = transformDataForNotify(
        testRegistrationData,
        testPostRegistrationMetadata,
        testLcContactConfigCombined
      );
    });

    it("given a combined hygiene and standards council", () => {
      const expectedFormat = {
        establishment_trading_name: "Itsu",
        establishment_trading_name_exists: "yes",
        operator_first_name: "Fred",
        operator_first_name_exists: "yes",
        establishment_postcode: "SW12 9RQ",
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
});
