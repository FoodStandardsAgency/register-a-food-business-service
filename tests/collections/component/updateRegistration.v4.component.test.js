const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
require("dotenv").config();
const { logEmitter } = require("../../../src/services/logging.service");
const mockRegistrationData = require("./mock-registration-data.json");

const baseUrl = process.env.COMPONENT_TEST_BASE_URL || "http://localhost:4000";
const url = `${baseUrl}/api/v4/collections/the-vale-of-glamorgan`;
const submitUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
let submitResponse;

jest.setTimeout(30000);

const frontendSubmitRegistration = async () => {
  try {
    const requestOptions = {
      method: "POST",
      data: mockRegistrationData[1],
      headers: {
        "Content-Type": "application/json",
        "client-name": process.env.FRONT_END_NAME,
        "api-secret": process.env.FRONT_END_SECRET,
        "registration-data-version": "2.2.0"
      }
    };

    const res = await axios(`${submitUrl}/api/submissions/createNewRegistration`, requestOptions);
    const response = res.data;
    return response;
  } catch (err) {
    logEmitter.emit("functionFail", "getSingleRegistration", "frontendSubmitRegistration", err);
  }
};
describe("PUT to /api/v4/collections/:lc/:fsa_rn", () => {
  beforeAll(async () => {
    submitResponse = await frontendSubmitRegistration();
  });
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        data: {
          collected: true
        },
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      };
      const res = await axios(`${url}/${submitResponse["fsa-rn"]}`, requestOptions);
      response = res.data;
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
        data: {
          collected: true
        },
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      };
      const res = await axios(`${url}/1234253`, requestOptions);
      response = res.data;
    });

    it("should return the getRegistrationNotFound error", () => {
      expect(response.statusCode).toBe(404);
      expect(response.errorCode).toBe("4");
      expect(response.developerMessage).toBe(
        "The registration application reference specified could not be found for the council requested. Please check this reference is definitely associated with this council"
      );
    });
  });
});
