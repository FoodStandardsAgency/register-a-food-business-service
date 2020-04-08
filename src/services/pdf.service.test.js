const {
  pdfGenerator,
  transformDataForPdf,
  convertKeyToDisplayName,
  convertBoolToString,
} = require("./pdf.service");
describe("Pdf Service: ", () => {
  let result;

  describe("Function: transformDataForPdf", () => {
    describe("when registration role is not partnership", () => {
      const mockRegistraionData = {
        establishment: {
          establishment_details: {
            establishment_trading_name: "Itsu",
            establishment_primary_number: "329857245",
            establishment_secondary_number: "84345245",
            establishment_email: "django@email.com",
            establishment_opening_date: "2018-06-07",
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
            operator_type: "Sole trader",
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locality",
            establishment_town: "London",
            establishment_type: "Place",
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
            opening_day_sunday: true,
          },
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration",
        },
      };

      describe("When given single council", () => {
        const mockLcContactConfig = {
          hygieneAndStandards: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
          },
        };

        beforeEach(() => {
          result = transformDataForPdf(
            mockRegistraionData,
            mockLcContactConfig
          );
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
          expect(result.metaData.lcInfo.local_council).toBe(
            "City of Cardiff Council"
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
          },
          standards: {
            code: 8015,
            local_council: "Standards Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
          },
        };

        beforeEach(() => {
          result = transformDataForPdf(
            mockRegistraionData,
            mockLcContactConfig
          );
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
          expect(result.metaData.lcInfo.local_council_hygiene).toBe(
            "City of Cardiff Council"
          );

          expect(result.metaData.lcInfo.local_council_standards).toBe(
            "Standards Council"
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
            establishment_opening_date: "2018-06-07",
          },
          operator: {
            operator_postcode: "SW12 9RQ",
            operator_address_line_1: "335",
            operator_address_line_2: "Some St.",
            operator_address_line_3: "Locality",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "operator@email.com",
            operator_type: "Sole trader",
            partners: [
              {
                partner_name: "Joe",
                partner_is_primary_contact: false,
              },
              {
                partner_name: "Tom",
                partner_is_primary_contact: true,
              },
            ],
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locality",
            establishment_town: "London",
            establishment_type: "Place",
          },
          activities: {
            customer_type: "End consumer",
            business_type: "Livestock farm",
            import_export_activities: "None",
            water_supply: "Public",
            opening_day_monday: true,
            opening_day_tuesday: true,
            opening_day_wednesday: true,
            opening_day_thursday: true,
            opening_day_friday: true,
            opening_day_saturday: true,
            opening_day_sunday: true,
          },
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration",
        },
      };

      describe("When given single council", () => {
        const mockLcContactConfig = {
          hygieneAndStandards: {
            code: 8015,
            local_council: "City of Cardiff Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
          },
        };

        beforeEach(() => {
          result = transformDataForPdf(
            mockRegistraionData,
            mockLcContactConfig
          );
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
          expect(result.metaData.lcInfo.local_council).toBe(
            "City of Cardiff Council"
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
          },
          standards: {
            code: 8015,
            local_council: "Standards Council",
            local_council_notify_emails: ["fsatestemail.valid@gmail.com"],
            local_council_email: "fsatestemail.valid@gmail.com",
            local_council_phone_number: "0300 123 6696",
          },
        };

        beforeEach(() => {
          result = transformDataForPdf(
            mockRegistraionData,
            mockLcContactConfig
          );
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
          expect(result.metaData.lcInfo.local_council_hygiene).toBe(
            "City of Cardiff Council"
          );

          expect(result.metaData.lcInfo.local_council_standards).toBe(
            "Standards Council"
          );
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
          operator_type: "Sole trader",
        },
        establishment: {
          establishment_trading_name: "Itsu",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "django@email.com",
          establishment_opening_date: "2018-06-07",
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "Place",
        },
        activities: {
          customer_type: "End consumer",
          business_type: "Livestock farm",
          import_export_activities: "None",
          water_supply: "Private",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true,
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration",
        },
        metaData: {
          "fsa-rn": "A35YQJ-VDGBAE-68J0HT",
          reg_submission_date: "2018-11-05",
          lcInfo: { local_council: "City of Cardiff Council" },
        },
      };

      beforeEach(async () => {
        result = await pdfGenerator(mockPdfData);
      });

      it("should return a base64 string", () => {
        expect(Buffer.from(result, "base64").toString("base64")).toBe(result);
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
          operator_type: "Sole trader",
        },
        partnershipDetails: {
          partner_names: "Joe, Tom",
          main_partnership_contact: "Tom",
        },
        establishment: {
          establishment_trading_name: "Itsu",
          establishment_primary_number: "329857245",
          establishment_secondary_number: "84345245",
          establishment_email: "django@email.com",
          establishment_opening_date: "2018-06-07",
          establishment_postcode: "SW12 9RQ",
          establishment_address_line_1: "123",
          establishment_address_line_2: "Street",
          establishment_address_line_3: "Locality",
          establishment_town: "London",
          establishment_type: "Place",
        },
        activities: {
          customer_type: "End consumer",
          business_type: "Livestock farm",
          import_export_activities: "None",
          water_supply: "Private",
          opening_day_monday: true,
          opening_day_tuesday: true,
          opening_day_wednesday: true,
          opening_day_thursday: true,
          opening_day_friday: true,
          opening_day_saturday: true,
          opening_day_sunday: true,
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration",
        },
        metaData: {
          "fsa-rn": "A35YQJ-VDGBAE-68J0HT",
          reg_submission_date: "2018-11-05",
          lcInfo: { local_council: "City of Cardiff Council" },
        },
      };

      beforeEach(async () => {
        result = await pdfGenerator(mockPdfData);
      });

      it("should return a base64 string", () => {
        expect(Buffer.from(result, "base64").toString("base64")).toBe(result);
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
