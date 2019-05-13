jest.mock("../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));

jest.mock("./pdf.service");

const { pdfGenerator } = require("./pdf.service");

const { sendSingleEmail } = require("../connectors/notify/notify.connector");

const {
  transformDataForNotify,
  sendNotifications
} = require("./notifications.service");

const testRegistrationData = {
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

const testRegistrationDataForPartnership = {
  establishment: {
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
      customer_type: "End consumer"
    }
  },
  metadata: {
    declaration1: "Declaration"
  }
};

const testPostRegistrationMetadata = {
  example: "value",
  reg_submission_date: "2018-12-01"
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

describe("Function: transformDataForNotify", () => {
  let result;

  describe("given registration role is not partnership", () => {
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
          operator_first_name: "Fred",
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
          reg_submission_date: "01 Dec 2018"
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
          operator_first_name: "Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          local_council_phone_number: "123456789",
          reg_submission_date: "01 Dec 2018"
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
          operator_first_name: "Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          reg_submission_date: "01 Dec 2018"
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
          operator_first_name: "Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          reg_submission_date: "01 Dec 2018"
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
          testPostRegistrationMetadata,
          testLcContactConfigSplitWithPhoneNumber
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_trading_name: "Itsu",
          operator_first_name: "Fred",
          main_contact: "Tom",
          partner_names: "Tom, Fred",
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
          reg_submission_date: "01 Dec 2018"
        };

        expect(result).toEqual(expectedFormat);
      });
    });
    describe("given a combined hygiene and standards councils with a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testPostRegistrationMetadata,
          testLcContactConfigCombinedWithPhoneNumber
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_trading_name: "Itsu",
          operator_first_name: "Fred",
          main_contact: "Tom",
          partner_names: "Tom, Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          local_council_phone_number: "123456789",
          reg_submission_date: "01 Dec 2018"
        };

        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given a combined hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testPostRegistrationMetadata,
          testLcContactConfigCombined
        );
      });

      it("should return the flattened data with one set of council details", () => {
        const expectedFormat = {
          establishment_trading_name: "Itsu",
          operator_first_name: "Fred",
          main_contact: "Tom",
          partner_names: "Tom, Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council: "Hygiene and standards council name",
          local_council_email: "both@example.com",
          reg_submission_date: "01 Dec 2018"
        };

        expect(result).toEqual(expectedFormat);
      });
    });

    describe("given separate hygiene and standards councils without a phone number", () => {
      beforeEach(() => {
        result = transformDataForNotify(
          testRegistrationDataForPartnership,
          testPostRegistrationMetadata,
          testLcContactConfigSplit
        );
      });

      it("should return the flattened data with two sets of council details", () => {
        const expectedFormat = {
          establishment_trading_name: "Itsu",
          operator_first_name: "Fred",
          main_contact: "Tom",
          partner_names: "Tom, Fred",
          establishment_postcode: "SW12 9RQ",
          establishment_opening_date: "30 Dec 2017",
          customer_type: "End consumer",
          declaration1: "Declaration",
          example: "value",
          local_council_hygiene: "Hygiene council name",
          local_council_email_hygiene: "hygiene@example.com",
          local_council_standards: "Standards council name",
          local_council_email_standards: "standards@example.com",
          reg_submission_date: "01 Dec 2018"
        };

        expect(result).toEqual(expectedFormat);
      });
    });
  });
});

describe("Function: sendEmailOfType: ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRegistrationData = {
    establishment: {
      establishment_details: {
        establishment_trading_name: "Itsu",
        establishment_primary_number: "329857245",
        establishment_secondary_number: "84345245",
        establishment_email: "django@email.com",
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
        operator_type: "Sole trader",
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
        establishment_postcode: "SW12 9RQ",
        establishment_first_line: "123",
        establishment_street: "Street",
        establishment_town: "London",
        establishment_type: "Place"
      },
      activities: {
        customer_type: "End consumer",
        business_type: "Livestock farm",
        import_export_activities: "None",
        opening_day_monday: true,
        opening_day_tuesday: true,
        opening_day_wednesday: true,
        opening_day_thursday: true,
        opening_day_friday: true,
        opening_day_saturday: true,
        opening_day_sunday: true
      }
    },
    metadata: {
      declaration1: "Declaration",
      declaration2: "Declaration",
      declaration3: "Declaration"
    }
  };
  const mockPostRegistrationData = {
    "fsa-rn": "DYRKYP-NPLKN7-YFDF6V",
    reg_submission_date: "2018-11-05"
  };

  const mockLcContactConfig = {
    hygieneAndStandards: {
      code: 8015,
      local_council: "City of Cardiff Council",
      local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
      local_council_email: "fsatestemail.valid@gmail.com",
      local_council_phone_number: "0300 123 6696"
    }
  };

  const testNotifyTemplateKeys = {
    lc_new_registration: "lc-123",
    fbo_submission_complete: "fbo-456"
  };

  describe("When the connector responds successfully", () => {
    const testPdfFile = "example base64 string";

    beforeEach(async () => {
      pdfGenerator.mockImplementation(() => testPdfFile);
      sendSingleEmail.mockImplementation(() => ({
        id: "123-456"
      }));
      await sendNotifications(
        mockLcContactConfig,
        mockRegistrationData,
        mockPostRegistrationData,
        testNotifyTemplateKeys
      );
    });

    it("should have called the connector with the correct arguments for the LC", () => {
      expect(sendSingleEmail.mock.calls[0][0]).toBe("lc-123");
      expect(sendSingleEmail.mock.calls[0][1]).toBe(
        "fsatestemail.valid@gmail.com"
      );
      expect(sendSingleEmail.mock.calls[0][3]).toBe(testPdfFile);
    });

    it("should transform data correctly", () => {
      expect(sendSingleEmail.mock.calls[0][2].operator_email).toBeDefined();
    });

    it("should have called the connector with the correct arguments for the FBO", () => {
      expect(sendSingleEmail.mock.calls[1][0]).toBe("fbo-456");
      expect(sendSingleEmail.mock.calls[1][1]).toBe("operator@email.com");
      expect(sendSingleEmail.mock.calls[1][3]).toBe(undefined);
    });
  });

  describe("When the connector throws an error", () => {
    let result;
    beforeEach(async () => {
      sendSingleEmail.mockImplementation(() => {
        throw new Error("Notify error");
      });
      try {
        await sendNotifications(
          mockLcContactConfig,
          mockRegistrationData,
          mockPostRegistrationData,
          testNotifyTemplateKeys
        );
      } catch (err) {
        result = err;
      }
    });

    it("should throw the error to the higher level", () => {
      expect(result.message).toBe("Notify error");
    });
  });

  describe("When there is a contact_representative_email and no operator email", () => {
    beforeEach(async () => {
      const newMockRegistrationData = JSON.parse(
        JSON.stringify(mockRegistrationData)
      );
      delete newMockRegistrationData.establishment.operator.operator_email;
      newMockRegistrationData.establishment.operator.contact_representative_email =
        "contact@email.com";
      const testPdfFile = "example base64 string";
      pdfGenerator.mockImplementation(() => testPdfFile);
      sendSingleEmail.mockImplementation(() => ({
        id: "123-456"
      }));
      await sendNotifications(
        mockLcContactConfig,
        newMockRegistrationData,
        mockPostRegistrationData,
        testNotifyTemplateKeys
      );
    });

    it("should call the connector with the correct email address", () => {
      expect(sendSingleEmail.mock.calls[1][1]).toBe("contact@email.com");
    });
  });
});
