jest.mock("axios");

const axios = require("axios");
const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const { smallAddressResponseJSON } = require("./smallAddressResponseMock.json");
const { regularIntegrationResponse } = require("./regularIntegrationResponse.json");

let responseJSON;

describe("Function: getAddressesByPostcode: ", () => {
  describe("Given a valid UK postcode:", () => {
    beforeEach(async () => {
      axios.mockImplementation(() => ({
        status: 200,
        data: smallAddressResponseJSON
      }));

      responseJSON = await getAddressesByPostcode("NR14 7PZ");
    });

    describe("When given a non-200 response from the API", () => {
      beforeEach(async () => {
        axios.mockImplementation(() => ({
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
        expect(result.message).toBe("Address lookup API responded with non-200 status: 500");
      });
    });

    describe("When premium service returns no addresses but standard service returns some addresses", () => {
      beforeEach(async () => {
        axios.mockImplementation(() => ({
          status: 200,
          data: regularIntegrationResponse
        }));
        axios.mockImplementationOnce(() => ({
          status: 200,
          data: []
        }));
        responseJSON = await getAddressesByPostcode("BS249ST");
      });

      it("should return the regular integration response", () => {
        expect(responseJSON).toEqual(regularIntegrationResponse);
      });
    });
    describe("When given a non-200 response from the API on second attempt", () => {
      beforeEach(async () => {
        axios.mockImplementation(() => ({
          status: 500
        }));
        axios.mockImplementationOnce(() => ({
          status: 200,
          data: []
        }));
      });

      it("should throw an error", async () => {
        let result;
        try {
          await getAddressesByPostcode("BS249ST", 100);
        } catch (err) {
          result = err;
        }
        expect(result.message).toBe("Address lookup API responded with non-200 status: 500");
      });
    });
  });

  describe("Given an invalid UK postcode:", () => {
    beforeEach(async () => {
      axios.mockImplementation(() => ({
        data: [],
        status: 200
      }));

      responseJSON = await getAddressesByPostcode("invalid postcode");
    });

    it("should return an empty array", () => {
      expect(responseJSON).toEqual([]);
    });
  });
});
