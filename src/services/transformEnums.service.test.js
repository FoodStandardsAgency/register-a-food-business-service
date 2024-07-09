const {
  // transformBusinessImportExportEnum,
  // transformBusinessTypeEnum,
  // transformCustomerTypeEnum,
  // transformEstablishmentTypeEnum,
  // transformOperatorTypeEnum,
  // transformWaterSupplyEnum,
  transformEnumsForCollections,
  transformEnumsForService
} = require("./transformEnums.service");

// const {
//   businessTypeEnum,
//   customerTypeEnum,
//   establishmentTypeEnum,
//   importExportEnum,
//   operatorTypeEnum,
//   waterSupplyEnum
// } = require("@slice-and-dice/register-a-food-business-validation");

let registrations = [
  {
    establishment: {
      establishment_details: {
        establishment_trading_name: "Testing name",
        establishment_primary_number: "09876 54321"
      },
      operator: {
        operator_first_name: "Tom",
        operator_last_name: "Healey",
        operator_type: "Sole trader"
      },
      premise: {
        establishment_postcode: "NR14 7PZ",
        establishment_town: "Norwich",
        establishment_type: "Mobile or moveable premises",
        establishment_address_line_1: "Test 1 Ltd"
      },
      activities: {
        customer_type: "End consumer",
        business_type: "Any other retailer",
        import_export_activities: "None",
        water_supply: "Private"
      }
    }
  },
  {
    establishment: {
      establishment_details: {
        establishment_trading_name: "Trading name",
        establishment_primary_number: "01234 456789"
      },
      operator: {
        operator_first_name: "Jeff",
        operator_last_name: "Healey",
        operator_type: "SOLETRADER"
      },
      premise: {
        establishment_postcode: "NR14 7PZ",
        establishment_town: "Norwich",
        establishment_type: "MOBILE",
        establishment_address_line_1: "Test 2 Ltd"
      },
      activities: {
        customer_type: "END_CONSUMER",
        business_type: "048",
        import_export_activities: "NONE",
        water_supply: "PRIVATE"
      }
    }
  },
  {
    establishment: {
      establishment_details: {
        establishment_trading_name: "Trading name",
        establishment_primary_number: "01234 456789"
      }
    }
  }
];

let data = {
  operator: {
    operator_first_name: "Tom",
    operator_last_name: "Healey",
    operator_type: "SOLETRADER"
  },
  activities: {
    customer_type: "END_CONSUMER",
    business_type: "048",
    import_export_activities: "NONE",
    water_supply: "PRIVATE",
    business_other_details: "business other details",
    business_scale: ["NATIONAL", "LOCAL", "FBO"],
    food_type: ["READY_TO_EAT", "IMPORTED"],
    processing_activities: ["REWRAPPING_OR_RELABELLING"]
  }
};

describe("transformEnumsForCollections", () => {
  describe("When api version is >= 2", () => {
    describe("When passed a single registration", () => {
      beforeEach(() => {
        transformEnumsForCollections("2", registrations[0]);
      });

      it("Should not perform any transform", () => {
        expect(registrations[1].establishment.operator.operator_type).toEqual("SOLETRADER");
        expect(registrations[1].establishment.operator.operator_first_name).toEqual("Jeff");
      });
    });
    describe("When passed an array of registration", () => {
      beforeEach(() => {
        transformEnumsForCollections("2", registrations);
      });

      it("Should not perform any transform", () => {
        expect(registrations[0].establishment.premise.establishment_type).toEqual(
          "Mobile or moveable premises"
        );
        expect(registrations[1].establishment.premise.establishment_type).toEqual("MOBILE");
        expect(registrations[1].establishment.operator.operator_first_name).toEqual("Jeff");
        expect(registrations[1].establishment.activities.business_type).toEqual("048");
      });
    });
  });
  describe("When api version is latest", () => {
    describe("When passed a single registration", () => {
      beforeEach(() => {
        transformEnumsForCollections("latest", registrations[0]);
      });
      it("Should not perform any transform", () => {
        expect(registrations[1].establishment.activities.customer_type).toEqual("END_CONSUMER");
        expect(registrations[1].establishment.operator.operator_first_name).toEqual("Jeff");
      });
    });
    describe("When passed an array of registration", () => {
      beforeEach(() => {
        transformEnumsForCollections("latest", registrations);
      });
      it("Should not perform any transform", () => {
        expect(registrations[0].establishment.activities.import_export_activities).toEqual("None");
        expect(registrations[1].establishment.activities.import_export_activities).toEqual("NONE");
        expect(registrations[1].establishment.operator.operator_first_name).toEqual("Jeff");
        expect(registrations[1].establishment.activities.business_type).toEqual("048");
      });
    });
  });
  describe("When api version is < 2", () => {
    describe("When passed a single registration", () => {
      beforeEach(() => {
        transformEnumsForCollections("1", registrations[1]);
      });
      it("Should only tranform enum keys to enum values", () => {
        expect(registrations[1].establishment.activities.water_supply).toEqual("Private");
        expect(registrations[0].establishment.operator.operator_first_name).toEqual("Tom");
      });
    });
    describe("When passed an array of registrations", () => {
      beforeEach(() => {
        transformEnumsForCollections("1", registrations);
      });

      it("Should only tranform enum keys to enum values", () => {
        expect(registrations[1].establishment.activities.import_export_activities).toEqual("None");
        expect(registrations[0].establishment.activities.import_export_activities).toEqual("None");
        expect(registrations[1].establishment.operator.operator_first_name).toEqual("Jeff");
        expect(registrations[1].establishment.activities.business_type).toEqual(
          "Market stalls with permanent pitch"
        );
      });
    });
  });
});

describe("applyEnumTransformsForService", () => {
  describe("when language is english", () => {
    beforeEach(() => {
      transformEnumsForService(data.activities, "en");
    });

    it("should only transform enum keys to english enum values", () => {
      expect(data.activities.customer_type).toEqual("End consumer");
      expect(data.activities.business_other_details).toEqual("business other details");
      expect(data.activities.processing_activities).toEqual(
        "Rewrapping and relabelling previously wrapped food"
      );
      expect(data.activities.food_type).toEqual(
        "Ready to eat food (food that will not be cooked or reheated before serving),\nFood that your business has imported (from outside the UK)"
      );
      expect(data.activities.business_scale).toEqual(
        "To national customers (who live or work across the UK),\nTo local customers (who live or work in the local area),\nTo provide food directly to other businesses"
      );
    });
  });
  describe("when language is welsh", () => {
    beforeEach(() => {
      transformEnumsForService(data.operator, "cy");
    });

    it("should only transform enum keys to welsh enum values", () => {
      expect(data.operator.operator_type).toEqual("Unig fasnachwr");
      expect(data.operator.operator_first_name).toEqual("Tom");
    });
  });
});

// describe("Function: transformBusinessImportEcportForNotify", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessImportExportEnum(importExportEnum.IMPORT.key);
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(importExportEnum.IMPORT.value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessImportExportEnum(
//         importExportEnum.IMPORT.key,
//         "cy"
//       );
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(importExportEnum.IMPORT.value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessImportExportEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
// describe("Function: transformBusinessTypeEnum", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessTypeEnum(businessTypeEnum["002"].key);
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(businessTypeEnum["002"].value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessTypeEnum(businessTypeEnum["002"].key, "cy");
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(businessTypeEnum["002"].value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformBusinessTypeEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
// describe("Function: transformCustomerTypeEnum", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformCustomerTypeEnum(customerTypeEnum.END_CONSUMER.key);
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(customerTypeEnum.END_CONSUMER.value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformCustomerTypeEnum(
//         customerTypeEnum.END_CONSUMER.key,
//         "cy"
//       );
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(customerTypeEnum.END_CONSUMER.value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformCustomerTypeEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
// describe("Function: transformEstablishmentTypeEnum", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformEstablishmentTypeEnum(
//         establishmentTypeEnum.DOMESTIC.key
//       );
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(establishmentTypeEnum.DOMESTIC.value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformEstablishmentTypeEnum(
//         establishmentTypeEnum.DOMESTIC.key,
//         "cy"
//       );
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(establishmentTypeEnum.DOMESTIC.value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformEstablishmentTypeEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
// describe("Function: transformOperatorTypeEnum", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformOperatorTypeEnum(operatorTypeEnum.COMPANY.key);
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(operatorTypeEnum.COMPANY.value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformOperatorTypeEnum(operatorTypeEnum.COMPANY.key, "cy");
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(operatorTypeEnum.COMPANY.value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformOperatorTypeEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
// describe("Function: transformWaterSupplyEnum", () => {
//   describe("When given a valid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformWaterSupplyEnum(waterSupplyEnum.PUBLIC.key);
//     });
//     it("should return the corresponding value.en", () => {
//       expect(result).toBe(waterSupplyEnum.PUBLIC.value.en);
//     });
//   });
//   describe("When given a valid enum key requested with welsh translation", () => {
//     let result;
//     beforeEach(() => {
//       result = transformWaterSupplyEnum(waterSupplyEnum.PUBLIC.key, "cy");
//     });
//     it("should return the corresponding value.cy", () => {
//       expect(result).toBe(waterSupplyEnum.PUBLIC.value.cy);
//     });
//   });
//   describe("When given an invalid enum key", () => {
//     let result;
//     beforeEach(() => {
//       result = transformWaterSupplyEnum("invalid");
//     });
//     it("should return null", () => {
//       expect(result).toBe(null);
//     });
//   });
// });
