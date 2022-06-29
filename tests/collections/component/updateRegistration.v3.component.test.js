const fetch = require("node-fetch");
require("dotenv").config();
const { logEmitter } = require("../../../src/services/logging.service");
const mockRegistrationData = require("./mock-registration-data.json");

const baseUrl = process.env.COMPONENT_TEST_BASE_URL || "http://localhost:4000";
const url = `${baseUrl}/api/v3/collections/the-vale-of-glamorgan`;
const submitUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
let submitResponse;

jest.setTimeout(30000);

const frontendSubmitRegistration = async () => {
  try {
    const requestOptions = {
      method: "POST",
      json: true,
      body: JSON.stringify(mockRegistrationData[1]),
      headers: {
        "Content-Type": "application/json",
        "client-name": process.env.FRONT_END_NAME,
        "api-secret": process.env.FRONT_END_SECRET,
        "registration-data-version": "2.1.0"
      }
    };

    const res = await fetch(
      `${submitUrl}/api/submissions/createNewRegistration`,
      requestOptions
    );
    const response = await res.json();
    return response;
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "getSingleRegistration",
      "frontendSubmitRegistration",
      err
    );
  }
};
describe("PUT to /api/v3/collections/:lc/:fsa_rn", () => {
  beforeAll(async () => {
    submitResponse = await frontendSubmitRegistration();
  });
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        json: true,
        method: "PUT",
        body: JSON.stringify({
          collected: true
        }),
        headers: {
          "Content-Type": "application/json"
        }
      };
      const res = await fetch(
        `${url}/${submitResponse["fsa-rn"]}`,
        requestOptions
      );
      response = await res.json();
    });

    it("should return the fsa_rn and collected", () => {
      expect(response.fsa_rn).toBeDefined();
      expect(response.collected).toBe(true);
    });
  });

  describe("Given council or fsa_rn which cannot be found", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}/1234253`,
        json: true,
        method: "PUT",
        body: JSON.stringify({
          collected: true
        }),
        headers: {
          "Content-Type": "application/json"
        }
      };
      const res = await fetch(`${url}/1234253`, requestOptions);
      response = await res.json();
    });

    it("should return the getRegistrationNotFound error", () => {
      expect(response.statusCode).toBe(404);
      expect(response.errorCode).toBe("4");
      expect(response.developerMessage).toBe(
        "The registration application reference specified could not be found for the council requested. Please check this reference is definitely associated with this council"
      );
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        json: true,
        headers: {
          "Content-Type": "application/json",
          "double-mode": "invalid double mode"
        }
      };
      const res = await fetch(`${url}/1234253`, requestOptions);
      response = await res.json();
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });

  describe("Given 'double-mode' header", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        json: true,
        headers: {
          "Content-Type": "application/json",
          "double-mode": "update"
        }
      };
      const res = await fetch(`${url}`, requestOptions);
      response = await res.json();
    });

    it("should return the double mode response", () => {
      expect(response.fsa_rn).toBe("1234");
    });
  });
});
