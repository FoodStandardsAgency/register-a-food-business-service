jest.mock("./address-lookup-api.connector", () => ({
  getAddressesByPostcode: jest.fn()
}));

const { getUprn } = require("./address-matcher");
const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const regularIntegrationResponse = require("./regularIntegrationResponse.json");

describe("Function: getUprn", () => {
  describe("when making a valid request with a match", () => {
    let result;
    beforeEach(async () => {
      getAddressesByPostcode.mockImplementation(
        () => regularIntegrationResponse
      );
      result = await getUprn("6 Eastfield Road", "PO57CDE");
    });

    it("should call getAddressesByPostcode", () => {
      expect(getAddressesByPostcode).toBeCalled();
    });

    it("should return matched UPRN", () => {
      expect(result).toBe("2630163102");
    });
  });

  describe("when making a valid request with no match", () => {
    let result;
    beforeEach(async () => {
      getAddressesByPostcode.mockImplementation(
        () => regularIntegrationResponse
      );
      result = await getUprn("10 No Match Road", "PO57CDE");
    });

    it("should call getAddressesByPostcode", () => {
      expect(getAddressesByPostcode).toBeCalled();
    });

    it("should return null", () => {
      expect(result).toBe(null);
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
      expect(getAddressesByPostcode).toBeCalled();
    });

    it("should return null", () => {
      expect(result).toBe(null);
    });
  });
});
