const { Validator } = require("jsonschema");
const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const { fetch } = require("node-fetch");
// const { largeAddressResponseJSON } = require("./largeAddressResponseMock.json");
const { smallAddressResponseJSON } = require("./smallAddressResponseMock.json");
const {
  regularIntegrationResponse
} = require("./regularIntegrationResponse.json");
const { addressSchema } = require("./addressSchema");
const { addressLookupDouble } = require("./address-lookup-api.double");

jest.mock("node-fetch");
jest.mock("./address-lookup-api.double");

const v = new Validator();

let responseJSON;

describe("Connector: lookupAPI: ", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = "false";
  });

  describe("Given a valid UK postcode:", () => {
    beforeEach(async () => {
      fetch.mockImplementation(() => ({
        json: jest.fn(() => smallAddressResponseJSON),
        status: 200
      }));

      responseJSON = await getAddressesByPostcode("NR14 7PZ");
    });

    it("is in a valid format", () => {
      expect(v.validate(responseJSON, addressSchema).errors).toHaveLength(0);
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

    // TODO JMB: debug multi-call code

    // describe("Given a UK postcode that returns MORE than 101 addresses and a specified limit of 101 addresses:", () => {
    //   beforeEach(async () => {
    //     fetch.mockImplementation(url => ({
    //       json: jest.fn(() => {
    //         if (url.includes("page=")) {
    //           return smallAddressResponseJSON;
    //         } else {
    //           return largeAddressResponseJSON;
    //         }
    //       }),
    //       status: 200
    //     }));

    //     responseJSON = await getAddressesByPostcode("uk", "CV4 7AL", 101);
    //   });

    //   it("it returns 101 addresses", () => {
    //     const correctResponse = JSON.parse(
    //       JSON.stringify(largeAddressResponseJSON)
    //     );

    //     delete correctResponse[99].morevalues;
    //     delete correctResponse[99].nextpage;
    //     delete correctResponse[99].totalresults;

    //     correctResponse.push(smallAddressResponseJSON[0]);

    //     expect(responseJSON).toEqual(correctResponse);
    //   });

    //   it("is in a valid format", () => {
    //     expect(v.validate(responseJSON, addressSchema).errors.length).toBe(0);
    //   });

    //   describe("When given a non-200 response from the API after a successful first request", () => {
    //     beforeEach(() => {
    //       fetch.mockImplementation(url => {
    //         console.log(url);
    //         if (url.includes("page=")) {
    //           return { status: 500 };
    //         } else {
    //           return {
    //             json: jest.fn(() => largeAddressResponseJSON),
    //             status: 200
    //           };
    //         }
    //       });
    //     });

    //     it("should throw an error", async () => {
    //       let result;
    //       try {
    //         await getAddressesByPostcode("uk", "CV4 7AL", 100);
    //       } catch (err) {
    //         result = err;
    //       }
    //       expect(result.message).toBe("Address lookup API is down");
    //     });
    //   });

    //   describe("Given a UK postcode that returns at least 200 addresses, a specified limit of 200 addresses, and metadata in the final address:", () => {
    //     const overTwoHundredAddressResponseJSON = JSON.parse(
    //       JSON.stringify(largeAddressResponseJSON)
    //     );

    //     overTwoHundredAddressResponseJSON[99].totalresults = 250;

    //     beforeEach(async () => {
    //       fetch.mockImplementation(() => ({
    //         json: jest.fn(() => overTwoHundredAddressResponseJSON),
    //         status: 200
    //       }));

    //       responseJSON = await getAddressesByPostcode("uk", "BS24 8AL", 200);
    //     });

    //     it("it returns 200 addresses", () => {
    //       const correctResponse = JSON.parse(
    //         JSON.stringify(overTwoHundredAddressResponseJSON)
    //       );

    //       delete correctResponse[99].morevalues;
    //       delete correctResponse[99].nextpage;
    //       delete correctResponse[99].totalresults;

    //       // duplicate the contents of the array to give it 200 addresses
    //       correctResponse.push(...correctResponse);

    //       expect(responseJSON).toEqual(correctResponse);
    //     });

    //     it("is in a valid format", () => {
    //       expect(v.validate(responseJSON, addressSchema).errors.length).toBe(0);
    //     });
    //   });
    // });
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
