require("dotenv").config();
const fetch = require("node-fetch");
const { logEmitter } = require("../../../src/services/logging.service");
const mockRegistrationData = require("./mock-registration-data.json");

const baseUrl = process.env.COMPONENT_TEST_BASE_URL || "http://localhost:4000";
const url = `${baseUrl}/api/v2/collections/cardiff`;
const submitUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
let submitResponse;

jest.setTimeout(30000);

const frontendSubmitRegistration = async () => {
  try {
    const requestOptions = {
      method: "POST",
      json: true,
      body: JSON.stringify(mockRegistrationData[0]),
      headers: {
        "Content-Type": "application/json",
        "client-name": process.env.FRONT_END_NAME,
        "api-secret": process.env.FRONT_END_SECRET,
        "registration-data-version": "2.1.0"
      }
    };

    var response = await fetch(
      `${submitUrl}/api/submissions/createNewRegistration`,
      requestOptions
    );
    return await response.json();
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "getSingleRegistration",
      "frontendSubmitRegistration",
      err
    );
  }
};

describe("GET to /api/v2/collections/:lc/:fsa_rn", () => {
  beforeAll(async () => {
    submitResponse = await frontendSubmitRegistration();
  });
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        json: true
      };
      var res = await fetch(
        `${url}/${submitResponse["fsa-rn"]}`,
        requestOptions
      );
      response = await res.json();
    });

    it("should return all the full details of that registration", () => {
      expect(response.establishment.establishment_trading_name).toBe(
        "Blanda Inc"
      );
      expect(response.metadata).toBeDefined();
    });
  });

  describe("Given council or fsa_rn which cannot be found", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        json: true
      };
      let res = await fetch(`${url}/1234253`, requestOptions);
      response = await res.json();
    });

    it("should return the getRegistrationNotFound error", () => {
      expect(response.statusCode).toBe(404);
      expect(response.errorCode).toBe("5");
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
          "double-mode": "invalid double mode"
        }
      };
      let res = await fetch(`${url}/1234253`, requestOptions);
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
          "double-mode": "single"
        }
      };
      let res = await fetch(`${url}`, requestOptions);
      response = await res.json();
    });

    it("should return the double mode response", () => {
      expect(response.establishment.establishment_trading_name).toBe("Itsu");
    });
  });
});
