require("dotenv").config();
const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const { logEmitter } = require("../../../src/services/logging.service");
const mockRegistrationData = require("./mock-registration-data.json");

const baseUrl = process.env.COMPONENT_TEST_BASE_URL || "http://localhost:4000";
const url = `${baseUrl}/api/v2/collections/unified`;
const submitUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
let submitResponses = [];

jest.setTimeout(30000);

const frontendSubmitRegistration = async () => {
  try {
    for (let index in mockRegistrationData) {
      const requestOptions = {
        method: "POST",
        data: mockRegistrationData[index],
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.FRONT_END_NAME,
          "api-secret": process.env.FRONT_END_SECRET,
          "registration-data-version": "2.2.0"
        }
      };

      const response = await axios(
        `${submitUrl}/api/submissions/createNewRegistration`,
        requestOptions
      );
      submitResponses.push(response.data);
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

describe("GET to /api/v2/collections/unified", () => {
  beforeAll(async () => {
    await frontendSubmitRegistration();
  });
  describe("Given successful parameters", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setMinutes(after.getMinutes() - 1);
      var res = await axios(
        `${url}?before=${before.toISOString()}&after=${after.toISOString()}`
      );
      response = res.data;
    });

    it("should return the two previously submitted registrations", () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThanOrEqual(2);
      expect(response.map((record) => record.fsa_rn)).toEqual(
        expect.arrayContaining(
          submitResponses.map((record) => record["fsa-rn"])
        )
      );
    });
  });

  describe("Given before and after are both in the future", () => {
    let response;
    beforeEach(async () => {
      let before = new Date();
      let after = new Date();
      before.setDate(before.getDate() + 20);
      after.setDate(after.getDate() + 15);

      var res = await axios(
        `${url}?before=${before.toISOString()}&after=${after.toISOString()}`
      );
      response = res.data;
    });

    it("should return zero new registrations", () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response).toHaveLength(0);
    });
  });

  describe("Given before and after are both before records were submitted", () => {
    let response;
    beforeEach(async () => {
      let before = new Date();
      let after = new Date();
      before.setMinutes(before.getMinutes() - 5);
      after.setMinutes(after.getMinutes() - 10);

      var res = await axios(
        `${url}?before=${before.toISOString()}&after=${after.toISOString()}`
      );
      response = res.data;
    });

    it("should return neither of the new registrations", () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.map((record) => record.fsa_rn)).not.toEqual(
        expect.arrayContaining(
          submitResponses.map((record) => record["fsa-rn"])
        )
      );
    });
  });

  describe("Given 'double-mode' header", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 5);

      const requestOptions = {
        headers: {
          "double-mode": "success"
        }
      };
      let res = await axios(
        `${url}?before=${before.toISOString()}&after=${after.toISOString()}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return the double mode response", () => {
      expect(response).toHaveLength(1);
      expect(response[0].establishment.establishment_trading_name).toBe("Itsu");
    });
  });

  describe("Given before and after range greater than 7 days", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 8);
      let res = await axios(
        `${url}?before=${before.toISOString()}&after=${after.toISOString()}`
      );
      response = res.data;
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });

  describe("Given no parameters", () => {
    let response;
    beforeEach(async () => {
      let res = await axios(url);
      response = res.data;
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });
});
