require("dotenv").config();
const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const baseUrl = "https://integration-fsa-rof-gateway.azure-api.net/registrations/v5/";
const unifiedUrl = `${baseUrl}unified`;
const unifiedAPIKey = "022a06ae44724035abbdcd7d00074125";

describe("Retrieve all registrations through API", () => {
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 7);
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": unifiedAPIKey
        }
      };
      const res = await axios(
        `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        requestOptions
      );
      response = res.data;
    });

    it("should return all the registrations in the specified time frame", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
      expect(response[0].fsa_rn).toBeDefined();
      expect(response[0].collected).toBeDefined();
    });
  });

  describe("Given the wrong API key", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 5);
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "unifiedAPIKeyWhichIsWrong"
        }
      };

      const res = await axios(
        `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        requestOptions
      );
      response = res.data;
    });

    it("should return a subscription incorrect error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("invalid subscription key.");
    });
  });

  describe("Given no subscription key", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 5);
      const requestOptions = {
        headers: {
          "Content-Type": "application/json"
        }
      };

      const res = await axios(
        `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        requestOptions
      );
      response = res.data;
    });

    it("Should return subscription key not found error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain(
        "Access denied due to a missing application credentials or subscription key. Make sure to include an application token or a subscription key when making requests to the API."
      );
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": unifiedAPIKey
        }
      };
      const res = await axios(
        `${unifiedUrl}?before=${before.toISOString()}&after=dfgdfggfgf&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        requestOptions
      );
      response = res.data;
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe("One of the supplied options is invalid");
      expect(response.rawError).toBe(
        "after option must be a valid ISO 8601 date and time ('yyyy-MM-ddTHH:mm:ssZ')"
      );
    });
  });
});
