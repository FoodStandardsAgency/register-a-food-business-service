const {
  transformBusinessImportExportEnum,
  transformBusinessTypeEnum,
  transformCustomerTypeEnum,
  transformEstablishmentTypeEnum,
  transformOperatorTypeEnum,
  transformWaterSupplyEnum
} = require("./transformEnums.service");

const {
  businessTypeEnum,
  customerTypeEnum,
  establishmentTypeEnum,
  importExportEnum,
  operatorTypeEnum,
  waterSupplyEnum
} = require("@slice-and-dice/register-a-food-business-validation");

describe("Function: transformBusinessImportEcportForNotify", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformBusinessImportExportEnum(importExportEnum.IMPORT.key);
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(importExportEnum.IMPORT.value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformBusinessImportExportEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
describe("Function: transformBusinessTypeEnum", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformBusinessTypeEnum(businessTypeEnum["002"].key);
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(businessTypeEnum["002"].value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformBusinessTypeEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
describe("Function: transformCustomerTypeEnum", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformCustomerTypeEnum(customerTypeEnum.END_CONSUMER.key);
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(customerTypeEnum.END_CONSUMER.value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformCustomerTypeEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
describe("Function: transformEstablishmentTypeEnum", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformEstablishmentTypeEnum(
        establishmentTypeEnum.DOMESTIC.key
      );
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(establishmentTypeEnum.DOMESTIC.value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformEstablishmentTypeEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
describe("Function: transformOperatorTypeEnum", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformOperatorTypeEnum(operatorTypeEnum.COMPANY.key);
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(operatorTypeEnum.COMPANY.value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformOperatorTypeEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
describe("Function: transformWaterSupplyEnum", () => {
  describe("When given a valid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformWaterSupplyEnum(waterSupplyEnum.PUBLIC.key);
    });
    it("should return the corresponding value", () => {
      expect(result).toBe(waterSupplyEnum.PUBLIC.value);
    });
  });
  describe("When given an ivalid enum key", () => {
    let result;
    beforeEach(() => {
      result = transformWaterSupplyEnum("invalid");
    });
    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
