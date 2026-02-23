jest.mock("./address-lookup-api.connector", () => ({
  getAddressesByPostcode: jest.fn()
}));

const { getUprn } = require("./address-matcher");
const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const regularIntegrationResponse = require("./regularIntegrationResponse.json");

describe("Function: getUprn", () => {
  describe("when making a valid request", () => {
    let result;
    beforeEach(async () => {
      getAddressesByPostcode.mockImplementation(() => regularIntegrationResponse);
    });

    describe("that matches fully", () => {
      beforeEach(async () => {
        result = await getUprn("6 Eastfield Road", "Hutton", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("that matches first line fully", () => {
      beforeEach(async () => {
        result = await getUprn("6 Eastfield Road", "", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("that matches first part of the first line", () => {
      beforeEach(async () => {
        result = await getUprn("6 Eastfield Road, Eastfield", "", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("that matches first part of the first line with additional whitespace", () => {
      beforeEach(async () => {
        result = await getUprn("  6 EASTFIELD ROAD  , EASTFIELD", "", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("that matches first and second lines combined", () => {
      beforeEach(async () => {
        result = await getUprn("6", "Eastfield Road", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("that matches first lines with comma", () => {
      beforeEach(async () => {
        result = await getUprn("6, Eastfield Road", "Hutton", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return matched UPRN", () => {
        expect(result).toBe("2630163102");
      });
    });

    describe("with no match", () => {
      beforeEach(async () => {
        result = await getUprn("10 No Match Road", "", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return null", () => {
        expect(result).toBe(null);
      });
    });

    describe("with similar first line number but not match", () => {
      beforeEach(async () => {
        result = await getUprn("6", "No Match Road", "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return null", () => {
        expect(result).toBe(null);
      });
    });

    describe("with numeric first line number and no second line", () => {
      beforeEach(async () => {
        result = await getUprn("6", null, "PO57CDE");
      });

      it("should call getAddressesByPostcode", () => {
        expect(getAddressesByPostcode).toHaveBeenCalled();
      });

      it("should return null", () => {
        expect(result).toBe(null);
      });
    });
  });

  describe("when an error occurs", () => {
    let result;
    beforeEach(async () => {
      getAddressesByPostcode.mockImplementation(() => {
        throw new Error();
      });
      result = await getUprn("10 No Match Road", "PO57CDE");
    });

    it("should call getAddressesByPostcode", () => {
      expect(getAddressesByPostcode).toHaveBeenCalled();
    });

    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
