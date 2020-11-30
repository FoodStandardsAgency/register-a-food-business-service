"use strict";
jest.mock("../connectors/cacheDb/cacheDb.connector.js");
jest.mock("../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));
const mockEmit = jest.fn();
jest.mock("./pdf.service");
jest.mock("./statusEmitter.service");
jest.mock("./logging.service", () => ({
  logEmitter: { emit: mockEmit }
}));

const moment = require("moment");
const today = moment().format("DD MMM YYYY");

const {
  generateEmailsToSend,
  transformDataForNotify
} = require("./notifications.service");

const {
  customerTypeEnum
} = require("@slice-and-dice/register-a-food-business-validation");

const exampleDeclaration = {
  declaration1: "Declaration"
};

const exampleRegistrationEstablishment = {
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
    customer_type: customerTypeEnum.END_CONSUMER.key
  }
};

const testRegistrationData = {
  establishment: exampleRegistrationEstablishment,
  declaration: exampleDeclaration,
  example: "value",
  reg_submission_date: "2018-12-01"
};

const examplePartnershipRegistrationEstablishment = {
  establishment_details: {
    establishment_trading_name: "Itsu",
    establishment_opening_date: "2017-12-30"
  },
  operator: {
    operator_first_name: "Fred",
    partners: [
      {
        partner_name: "Tom",
        partner_is_primary_contact: true
      },
      {
        partner_name: "Fred",
        partner_is_primary_contact: false
      }
    ]
  },
  premise: {
    establishment_postcode: "SW12 9RQ"
  },
  activities: {
    customer_type: customerTypeEnum.END_CONSUMER.key
  }
};

const testRegistrationDataForPartnership = {
  establishment: examplePartnershipRegistrationEstablishment,
  declaration: exampleDeclaration
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
    local_council_phone_number: "123456789",
    country: "wales",
    hasAuth: true
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

const testConfigData = {
  _id: "9.9.9",
  notify_template_keys: {
    fbo_submission_complete: "integration-test",
    lc_new_registration: "integration-test",
    fbo_feedback: "integration-test",
    fd_feedback: "integration-test"
  }
};

describe(`generateEmailsToSend`, () => {
  it(`Test operator_email is matched to FBO`, () => {
    let regData = {
      establishment: {
        operator: {
          operator_email: "testop"
        }
      }
    };
    let lcConfig = {};

    let result = generateEmailsToSend(regData, lcConfig, testConfigData);

    expect(result).toStrictEqual([
      { address: "testop", templateId: "integration-test", type: "FBO" }
    ]);
  });

  it(`Test contact_representative_email is matched to FBO`, () => {
    let regData = {
      establishment: {
        operator: {
          contact_representative_email: "testrep"
        }
      }
    };
    let lcConfig = {};

    let result = generateEmailsToSend(regData, lcConfig, testConfigData);

    expect(result).toStrictEqual([
      { address: "testrep", templateId: "integration-test", type: "FBO" }
    ]);
  });

  it(`Test lc councils are collated`, () => {
    let regData = {
      establishment: {
        operator: {
          contact_representative_email: "testrep"
        }
      }
    };
    let lcConfig = {
      fakeCouncilOne: {
        local_council_notify_emails: [
          "fake_notify_1@test.com",
          "fake_notify_2@test.com"
        ]
      },
      fakeCouncilTwo: {
        local_council_notify_emails: [
          "fake_notify_3@test.com",
          "fake_notify_4@test.com"
        ]
      }
    };

    let result = generateEmailsToSend(regData, lcConfig, testConfigData);

    expect(result).toStrictEqual([
      {
        type: "LC",
        address: "fake_notify_1@test.com",
        templateId: "integration-test"
      },
      {
        type: "LC",
        address: "fake_notify_2@test.com",
        templateId: "integration-test"
      },
      {
        type: "LC",
        address: "fake_notify_3@test.com",
        templateId: "integration-test"
      },
      {
        type: "LC",
        address: "fake_notify_4@test.com",
        templateId: "integration-test"
      },
      {
        type: "FBO",
        address: "testrep",
        templateId: "integration-test"
      }
    ]);
  });

  it(`Test declaration emails`, () => {
    let regData = {
      establishment: {
        operator: {
          contact_representative_email: "testrep"
        }
      },
      declaration: {
        feedback1: { test: "test" }
      }
    };
    let lcConfig = {};

    let result = generateEmailsToSend(regData, lcConfig, testConfigData);

    expect(result).toStrictEqual([
      {
        type: "FBO",
        address: "testrep",
        templateId: "integration-test"
      },
      {
        type: "FBO_FB",
        address: "testrep",
        templateId: "integration-test"
      },
      {
        type: "FD_FB",
        address: undefined,
        templateId: "integration-test"
      }
    ]);
  });
});

describe("Function: transformDataForNotify", () => {
  let result;

  describe("given registration role is not partnership", () => {
    describe("given separate hygiene and standards councils with a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationData,
          testLcContactConfigSplitWithPhoneNumber
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "01 Dec 2018",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          country: undefined,
          hasAuth: undefined,
          local_council_phone_number_hygiene: "123456789",
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          local_council_phone_number_standards: "123456789",
          example: "value",
          establishment_postcode_FD: "SW12"
        };
        expect(result).toEqual(expectedFormat);
      });
    });
    describe("given a combined hygiene and standards councils with a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationData,
          testLcContactConfigCombinedWithPhoneNumber
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "01 Dec 2018",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          country: "wales",
          hasAuth: true,
          local_council_phone_number: "123456789",
          example: "value",
          establishment_postcode_FD: "SW12"
        };
        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given a combined hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationData,
          testLcContactConfigCombined
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "01 Dec 2018",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          country: undefined,
          hasAuth: undefined,
          example: "value",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given separate hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationData,
          testLcContactConfigSplit
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "01 Dec 2018",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          country: undefined,
          hasAuth: undefined,
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          example: "value",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });
  });

  describe("given registration role is partnership", () => {
    describe("given separate hygiene and standards councils with a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testLcContactConfigSplitWithPhoneNumber
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "27 Nov 2020",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          country: undefined,
          hasAuth: undefined,
          local_council_phone_number_hygiene: "123456789",
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          local_council_phone_number_standards: "123456789",
          partner_names: "Tom, Fred",
          main_contact: "Tom",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });
    describe("given a combined hygiene and standards councils with a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testLcContactConfigCombinedWithPhoneNumber
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "27 Nov 2020",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          country: "wales",
          hasAuth: true,
          local_council_phone_number: "123456789",
          partner_names: "Tom, Fred",
          main_contact: "Tom",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given a combined hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testLcContactConfigCombined
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "27 Nov 2020",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          country: undefined,
          hasAuth: undefined,
          partner_names: "Tom, Fred",
          main_contact: "Tom",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given separate hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testLcContactConfigSplit
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_postcode: "SW12 9RQ",
          establishment_trading_name: "Itsu",
          establishment_opening_date: "30 Dec 2017",
          operator_first_name: "Fred",
          customer_type: "End consumer",
          declaration1: "Declaration",
          reg_submission_date: "27 Nov 2020",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          country: undefined,
          hasAuth: undefined,
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          partner_names: "Tom, Fred",
          main_contact: "Tom",
          establishment_postcode_FD: "SW12"
        };

        expect(result).toEqual(expectedFormat);
      });
    });
  });
});
