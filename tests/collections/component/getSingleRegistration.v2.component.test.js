require("dotenv").config();
const axios = require("axios").default;
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
      data: mockRegistrationData[0],
      headers: {
        "Content-Type": "application/json",
        "client-name": process.env.FRONT_END_NAME,
        "api-secret": process.env.FRONT_END_SECRET,
        "registration-data-version": "2.2.0"
      }
    };

    var response = await axios(
      `${submitUrl}/api/submissions/createNewRegistration`,
      requestOptions
    );
    return response.data;
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
      var res = await axios(`${url}/${submitResponse["fsa-rn"]}`);
      response = res.data;
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
      let res = await axios(`${url}/1234253`);
      response = res.data;
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
        headers: {
          "double-mode": "invalid double mode"
        }
      };
      let res = await axios(`${url}/1234253`, requestOptions);
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

  describe("Given 'double-mode' header", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "double-mode": "single"
        }
      };
      let res = await axios(`${url}`, requestOptions);
      response = res.data;
    });

    it("should return the double mode response", () => {
      expect(response.establishment.establishment_trading_name).toBe("Itsu");
    });
  });
});
