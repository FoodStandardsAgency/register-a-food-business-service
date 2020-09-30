jest.mock("node-fetch");
jest.mock("./address-lookup-api.double");

const fetch = require("node-fetch");
const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const { smallAddressResponseJSON } = require("./smallAddressResponseMock.json");
const {
  regularIntegrationResponse
} = require("./regularIntegrationResponse.json");
const { addressLookupDouble } = require("./address-lookup-api.double");

let responseJSON;

describe("Function: getAddressesByPostcode: ", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = "false";
  });

  describe("Given a valid UK postcode:", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => ({
        status: 200,
        json: () => smallAddressResponseJSON
      }));

      responseJSON = await getAddressesByPostcode("NR14 7PZ");
    });

    describe("When DOUBLE_MODE is set", () => {
      beforeEach(async () => {
        process.env.DOUBLE_MODE = "true";
        addressLookupDouble.mockImplementation(() => ({
          json: () => regularIntegrationResponse,
          status: 200
        }));

        responseJSON = await getAddressesByPostcode("BS249ST");
      });

      afterEach(() => {
        process.env.DOUBLE_MODE = "false";
      });

      it("should return the regular integration response", () => {
        expect(responseJSON).toEqual(regularIntegrationResponse);
      });
    });

    describe("When given a non-200 response from the API", () => {
      beforeEach(async () => {
        fetch.mockImplementation(() => ({
          status: 500
        }));
      });

      it("should throw an error", async () => {
        let result;
        try {
          await getAddressesByPostcode("BS249ST", 100);
        } catch (err) {
          result = err;
        }
        expect(result.message).toBe(
          "Address lookup API responded with non-200 status: 500"
        );
      });
    });

    describe("When premium service returns no addresses but standard service returns some addresses", () => {
      beforeEach(async () => {
        fetch.mockImplementation(() => ({
          status: 200,
          json: jest.fn(() => regularIntegrationResponse)
        }));
        fetch.mockImplementationOnce(() => ({
          status: 200,
          json: jest.fn(() => [])
        }));
        responseJSON = await getAddressesByPostcode("BS249ST");
      });

      it("should return the regular integration response", () => {
        expect(responseJSON).toEqual(regularIntegrationResponse);
      });
    });
    describe("When given a non-200 response from the API on second attempt", () => {
      beforeEach(async () => {
        fetch.mockImplementation(() => ({
          status: 500
        }));
        fetch.mockImplementationOnce(() => ({
          status: 200,
          json: jest.fn(() => [])
        }));
      });

      it("should throw an error", async () => {
        let result;
        try {
          await getAddressesByPostcode("BS249ST", 100);
        } catch (err) {
          result = err;
        }
        expect(result.message).toBe(
          "Address lookup API responded with non-200 status: 500"
        );
      });
    });
  });

  describe("Given an invalid UK postcode:", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => ({
        json: jest.fn(() => []),
        status: 200
      }));

      responseJSON = await getAddressesByPostcode("invalid postcode");
    });

    it("should return an empty array", () => {
      expect(responseJSON).toEqual([]);
    });

    describe("When DOUBLE_MODE is set", () => {
      beforeEach(async () => {
        process.env.DOUBLE_MODE = "true";
        addressLookupDouble.mockImplementation(() => ({
          json: () => [],
          status: 200
        }));

        responseJSON = await getAddressesByPostcode("invalid postcode");
      });

      afterEach(() => {
        process.env.DOUBLE_MODE = "false";
      });

      it("should return an empty array", () => {
        expect(responseJSON).toEqual([]);
      });
    });
  });
});
