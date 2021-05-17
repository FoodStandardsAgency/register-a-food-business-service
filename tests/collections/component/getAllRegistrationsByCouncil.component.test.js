require("dotenv").config();
const request = require("request-promise-native");
const { logEmitter } = require("../../../src/services/logging.service");
const mockRegistrationData = require("./mock-registration-data.json");

const baseUrl = process.env.COMPONENT_TEST_BASE_URL || "http://localhost:4000";
const url = `${baseUrl}/api/collections/cardiff`;
const submitUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
let submitResponses = [];

jest.setTimeout(30000);

const frontendSubmitRegistration = async () => {
  try {
    for (let index in mockRegistrationData) {
      const requestOptions = {
        uri: `${submitUrl}/api/submissions/createNewRegistration`,
        method: "POST",
        json: true,
        body: mockRegistrationData[index],
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.FRONT_END_NAME,
          "api-secret": process.env.FRONT_END_SECRET,
          "registration-data-version": "2.1.0"
        }
      };

      const response = await request(requestOptions);
      submitResponses.push(response);
    }
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "getSingleRegistration",
      "frontendSubmitRegistration",
      err
    );
  }
};

describe("GET to /api/collections/:lc", () => {
  beforeAll(async () => {
    await frontendSubmitRegistration();
  });
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      // await resetDB();
      const requestOptions = {
        uri: url,
        json: true
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for that council including the one just submitted", () => {
      expect(
        response.find(
          (record) => record.fsa_rn === submitResponses[0]["fsa-rn"]
        )
      ).toBeDefined();
      expect(
        response.find(
          (record) => record.fsa_rn === submitResponses[1]["fsa-rn"]
        )
      ).toBeUndefined();
      response.forEach((record) => {
        expect(record.collected).toBe(false);
      });
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}?new=alskdfj`,
        json: true
      };
      try {
        await request(requestOptions);
      } catch (err) {
        response = err;
      }
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.error.errorCode).toBe("17");
      expect(response.error.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });

  describe("Given no 'fields' parameter", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: url,
        json: true
      };
      response = await request(requestOptions);
    });

    it("should return on the summary information for the registrations", () => {
      expect(response[0].establishment).toEqual({});
      expect(response[0].metadata).toEqual({});
    });
  });

  describe("Given 'fields' parameter", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}?fields=establishment,metadata`,
        json: true
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for that council", () => {
      expect(
        response[0].establishment.establishment_trading_name
      ).toBeDefined();
      expect(response[0].metadata.declaration1).toBeDefined();
    });
  });

  describe("Given 'new=false' parameter", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}?new=false`,
        json: true
      };
      response = await request(requestOptions);
    });

    it("should return all the registrations for the council", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Given 'double-mode' header", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}`,
        json: true,
        headers: {
          "double-mode": "success"
        }
      };
      response = await request(requestOptions);
    });

    it("should return the double mode response", () => {
      expect(response).toHaveLength(1);
      expect(response[0].establishment.establishment_trading_name).toBe("Itsu");
    });
  });
});
