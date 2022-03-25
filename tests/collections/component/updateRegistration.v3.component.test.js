const request = require("request-promise-native");
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
      uri: `${submitUrl}/api/submissions/createNewRegistration`,
      method: "POST",
      json: true,
      body: mockRegistrationData[1],
      headers: {
        "Content-Type": "application/json",
        "client-name": process.env.FRONT_END_NAME,
        "api-secret": process.env.FRONT_END_SECRET,
        "registration-data-version": "3.0.0"
      }
    };

    const response = await request(requestOptions);
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
        uri: `${url}/${submitResponse["fsa-rn"]}`,
        json: true,
        method: "PUT",
        body: {
          collected: true
        }
      };
      response = await request(requestOptions);
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
        body: {
          collected: true
        }
      };
      try {
        await request(requestOptions);
      } catch (err) {
        response = err;
      }
    });

    it("should return the getRegistrationNotFound error", () => {
      expect(response.statusCode).toBe(404);
      expect(response.error.errorCode).toBe("4");
      expect(response.error.developerMessage).toBe(
        "The registration application reference specified could not be found for the council requested. Please check this reference is definitely associated with this council"
      );
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}/1234253`,
        json: true,
        headers: {
          "double-mode": "invalid double mode"
        }
      };
      try {
        await request(requestOptions);
      } catch (err) {
        response = err;
      }
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.error.errorCode).toBe("3");
      expect(response.error.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });

  describe("Given 'double-mode' header", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${url}`,
        json: true,
        headers: {
          "double-mode": "update"
        }
      };
      response = await request(requestOptions);
    });

    it("should return the double mode response", () => {
      expect(response.fsa_rn).toBe("1234");
    });
  });
});
