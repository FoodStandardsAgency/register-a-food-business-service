const {
  pdfGenerator,
  transformDataForPdf,
  convertKeyToDisplayName,
  convertBoolToString
} = require("./pdf.service");
const i18n = require("../utils/i18n/i18n");
const i18nUtil = new i18n("en");
const fs = require("fs");
describe("Pdf Service: ", () => {
  let result;

  describe("Function: transformDataForPdf", () => {
    describe("when registration role is not partnership", () => {
      const mockRegistraionData = {
        "fsa-rn": "A35YQJ-VDGBAE-68J0HT",
        establishment: {
          establishment_details: {
            establishment_trading_name: "Itsu",
            establishment_primary_number: "329857245",
            establishment_secondary_number: "84345245",
            establishment_email: "django@email.com",
            establishment_web_address: "test.com",
            establishment_opening_date: "2018-06-07",
            establishment_additional_trading_names: ["Itsu 1", "Itsu 2"]
          },
          operator: {
            operator_first_name: "Fred",
            operator_last_name: "Bloggs",
            operator_postcode: "SW12 9RQ",
            operator_birthdate: "1990-02-20",
            operator_address_line_1: "335",
            operator_address_line_2: "Some St.",
            operator_address_line_3: "Locality",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "operator@email.com",
            operator_type: "SOLETRADER"
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locality",
            establishment_town: "London",
            establishment_type: "DOMESTIC"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "002",
            import_export_activities: "NONE",
            water_supply: "PUBLIC",
            business_scale: ["NATIONAL", "LOCAL", "FBO"],
            food_type: ["READY_TO_EAT", "IMPORTED"],
            processing_activities: ["REWRAPPING_OR_RELABELLING"],
            opening_day_monday: true,
            opening_day_tuesday: true,
            opening_day_wednesday: true,
            opening_day_thursday: true,
            opening_day_friday: true,
            opening_day_saturday: true,
            opening_day_sunday: true
          }
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      };

      describe("When given single council", () => {
        const mockLcContactConfig = {
          hygieneAndStandards: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          }
        };

        beforeEach(async () => {
          result = transformDataForPdf(mockRegistraionData, mockLcContactConfig);
          // test pdf generation
          // pdf = await pdfGenerator(result, i18nUtil);
          // fs.writeFileSync("/home/ernest/Source/test.pdf", pdf);
        });

        it("Should return an object with required sections", () => {
          expect(typeof result).toBe("object");
          expect(result.operator).toBeDefined();
          expect(result.establishment).toBeDefined();
          expect(result.activities).toBeDefined();
          expect(result.declaration).toBeDefined();
          expect(result.metaData).toBeDefined();
        });

        it("Should create a single local council for lcInfo", () => {
          expect(result.metaData.lcInfo.local_council).toBe("City of Cardiff Council");
        });
        it("Should return lcInfo.country", () => {
          expect(result.metaData.lcInfo.country).toBe("wales");
        });

        it("Should return correct value for additional_trading_names transformed fields", () => {
          expect(result.establishment.establishment_additional_trading_names).toBe(
            "• Itsu 1\n• Itsu 2"
          );
        });
      });

      describe("When given seperate hygiene and standards council", () => {
        const mockLcContactConfig = {
          hygiene: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          },
          standards: {
            code: 8015,
            local_council: "Standards Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          }
        };

        beforeEach(() => {
          result = transformDataForPdf(mockRegistraionData, mockLcContactConfig);
        });

        it("Should return an object with required sections", () => {
          expect(typeof result).toBe("object");
          expect(result.operator).toBeDefined();
          expect(result.establishment).toBeDefined();
          expect(result.activities).toBeDefined();
          expect(result.declaration).toBeDefined();
          expect(result.metaData).toBeDefined();
        });

        it("Should create a single local council for lcInfo", () => {
          expect(result.metaData.lcInfo.local_council_hygiene).toBe("City of Cardiff Council");

          expect(result.metaData.lcInfo.local_council_standards).toBe("Standards Council");
        });
        it("Should return lcInfo.country", () => {
          expect(result.metaData.lcInfo.country).toBe("wales");
        });
        it("Should return correct value for date transformed fields", () => {
          expect(result.operator.operator_birthdate).toBe("20 Feb 1990");
        });
        it("Should return correct value for key transformed fields", () => {
          expect(result.operator.operator_type).toBe("Sole trader");
          expect(result.establishment.establishment_type).toBe("Home or domestic premises");
          expect(result.activities.customer_type).toBe("End consumer");
          expect(result.activities.business_type).toBe("Livestock farm");
          expect(result.activities.import_export_activities).toBe("None");
          expect(result.activities.water_supply).toBe("Public");
          expect(result.activities.processing_activities).toEqual(
            "Rewrapping and relabelling previously wrapped food"
          );
          expect(result.activities.food_type).toEqual(
            "Ready to eat food (food that will not be cooked or reheated before serving),\nFood that your business has imported (from outside the UK)"
          );
          expect(result.activities.business_scale).toEqual(
            "To national customers (who live or work across the UK),\nTo local customers (who live or work in the local area),\nTo provide food directly to other food businesses"
          );
        });
      });
    });
    describe("when registration role is partnership", () => {
      const mockRegistraionData = {
        establishment: {
          establishment_details: {
            establishment_trading_name: "Itsu",
            establishment_primary_number: "329857245",
            establishment_secondary_number: "84345245",
            establishment_email: "django@email.com",
            establishment_web_address: "test.com",
            establishment_opening_date: "2018-06-07",
            establishment_additional_trading_names: ["Itsu 1", "Itsu 2"]
          },
          operator: {
            operator_postcode: "SW12 9RQ",
            operator_address_line_1: "335",
            operator_address_line_2: "Some St.",
            operator_address_line_3: "Locality",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "operator@email.com",
            operator_type: "SOLETRADER",
            partners: [
              {
                partner_name: "Joe",
                partner_is_primary_contact: false
              },
              {
                partner_name: "Tom",
                partner_is_primary_contact: true
              }
            ]
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locality",
            establishment_town: "London",
            establishment_type: "DOMESTIC"
          },
          activities: {
            customer_type: "END_CONSUMER",
            business_type: "002",
            import_export_activities: "NONE",
            water_supply: "PUBLIC",
            opening_day_monday: true,
            opening_day_tuesday: true,
            opening_day_wednesday: true,
            opening_day_thursday: true,
            opening_day_friday: true,
            opening_day_saturday: true,
            opening_day_sunday: true
          }
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      };

      describe("When given single council", () => {
        const mockLcContactConfig = {
          hygieneAndStandards: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          }
        };

        beforeEach(() => {
          result = transformDataForPdf(mockRegistraionData, mockLcContactConfig);
        });

        it("Should return an object with required sections", () => {
          expect(typeof result).toBe("object");
          expect(result.operator).toBeDefined();
          expect(result.partnershipDetails).toBeDefined();
          expect(result.establishment).toBeDefined();
          expect(result.activities).toBeDefined();
          expect(result.declaration).toBeDefined();
          expect(result.metaData).toBeDefined();
        });

        it("Should create a single local council for lcInfo", () => {
          expect(result.metaData.lcInfo.local_council).toBe("City of Cardiff Council");
        });
        it("Should return lcInfo.country", () => {
          expect(result.metaData.lcInfo.country).toBe("wales");
        });
        it("Should return correct value for key transformed fields", () => {
          expect(result.operator.operator_type).toBe("Sole trader");
          expect(result.establishment.establishment_type).toBe("Home or domestic premises");
          expect(result.activities.customer_type).toBe("End consumer");
          expect(result.activities.business_type).toBe("Livestock farm");
          expect(result.activities.import_export_activities).toBe("None");
          expect(result.activities.water_supply).toBe("Public");
        });
      });

      describe("When given seperate hygiene and standards council", () => {
        const mockLcContactConfig = {
          hygiene: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          },
          standards: {
            code: 8015,
            local_council: "Standards Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
            country: "wales"
          }
        };

        beforeEach(() => {
          result = transformDataForPdf(mockRegistraionData, mockLcContactConfig);
        });

        it("Should return an object with required sections", () => {
          expect(typeof result).toBe("object");
          expect(result.operator).toBeDefined();
          expect(result.establishment).toBeDefined();
          expect(result.activities).toBeDefined();
          expect(result.declaration).toBeDefined();
          expect(result.metaData).toBeDefined();
        });

        it("Should create a single local council for lcInfo", () => {
          expect(result.metaData.lcInfo.local_council_hygiene).toBe("City of Cardiff Council");

          expect(result.metaData.lcInfo.local_council_standards).toBe("Standards Council");
        });
        it("Should return lcInfo.country", () => {
          expect(result.metaData.lcInfo.country).toBe("wales");
        });
        it("Should return correct value for key transformed fields", () => {
          expect(result.operator.operator_type).toBe("Sole trader");
          expect(result.establishment.establishment_type).toBe("Home or domestic premises");
          expect(result.activities.customer_type).toBe("End consumer");
          expect(result.activities.business_type).toBe("Livestock farm");
          expect(result.activities.import_export_activities).toBe("None");
          expect(result.activities.water_supply).toBe("Public");
        });
      });
    });
  });

  describe("Function: pdfGenerator", () => {
    describe("when registration role is not partnership", () => {
      const mockPdfData = {
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
          operator_type: "SOLETRADER"
        },
        establishment: {
          establishment_trading_name: "Itsu",
          establishment_additional_trading_names: "Itsu 1, Itsu 2",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "django@email.com",
          establishment_web_address: "test.com",
          establishment_opening_date: "2018-06-07",
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "DOMESTIC"
        },
        activities: {
          customer_type: "END_CONSUMER",
          business_type: "002",
          import_export_activities: "NONE",
          water_supply: "Private",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        },
        metaData: {
          "fsa-rn": "A35YQJ-VDGBAE-68J0HT",
          reg_submission_date: "2018-11-05",
          lcInfo: { local_council: "City of Cardiff Council" }
        }
      };

      beforeEach(async () => {
        result = await pdfGenerator(mockPdfData, i18nUtil);
      });

      it("should return a string", () => {
        expect(Buffer.from(result).toString()).toBe(result.toString());
      });
    });
    describe("when registration role is partnership", () => {
      const mockPdfData = {
        operator: {
          operator_postcode: "SW12 9RQ",
          operator_address_line_1: "335",
          operator_address_line_2: "Some St.",
          operator_address_line_3: "Locality",
          operator_town: "London",
          operator_primary_number: "9827235",
          operator_email: "operator@email.com",
          operator_type: "SOLETRADER"
        },
        partnershipDetails: {
          partner_names: "Joe, Tom",
          main_partnership_contact: "Tom"
        },
        establishment: {
          establishment_trading_name: "Itsu",
          establishment_additional_trading_names: "Itsu 1, Itsu 2",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "django@email.com",
          establishment_web_address: "test.com",
          establishment_opening_date: "2018-06-07",
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "DOMESTIC"
        },
        activities: {
          customer_type: "END_CONSUMER",
          business_type: "002",
          import_export_activities: "NONE",
          water_supply: "Private",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        },
        metaData: {
          "fsa-rn": "A35YQJ-VDGBAE-68J0HT",
          reg_submission_date: "2018-11-05",
          lcInfo: { local_council: "City of Cardiff Council" }
        }
      };

      beforeEach(async () => {
        result = await pdfGenerator(mockPdfData, i18nUtil);
      });

      it("should return a base64 string", () => {
        expect(Buffer.from(result).toString()).toBe(result.toString());
      });
    });
  });

  describe("Function: convertKeyToDisplayName", () => {
    beforeEach(() => {
      result = convertKeyToDisplayName("test_key_name");
    });

    it("should remove underscores", () => {
      expect(result.includes("_")).toBe(false);
    });

    it("should uppercase first letter", () => {
      expect(result[0]).toBe("T");
    });
  });
});

describe("Function: convertBoolToString", () => {
  it("should convert false to 'No'", () => {
    expect(convertBoolToString(false)).toBe("No");
  });
  it("should convert true to 'Yes'", () => {
    expect(convertBoolToString(true)).toBe("Yes");
  });
});
