require("dotenv").config();
const request = require("request-promise-native");

const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v3/";
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
        uri: `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": unifiedAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return all the registrations in the specified time frame", () => {
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].fsa_rn).toBeDefined();
      expect(response.body[0].collected).toBeDefined();
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given the wrong API key", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 5);
      const requestOptions = {
        uri: `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": "unifiedAPIKeyWhichIsWrong"
        }
      };

      await request(requestOptions).catch(function (body) {
        response = body;
      });
    });

    it("should return a subscription incorrect error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.error.message).toContain("invalid subscription key.");
    });
  });

  describe("Given no subscription key", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      let after = new Date();
      after.setDate(after.getDate() - 5);
      const requestOptions = {
        uri: `${unifiedUrl}?before=${before.toISOString()}&after=${after.toISOString()}&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        json: true
      };

      await request(requestOptions).catch(function (body) {
        response = body;
      });
    });

    it("Should return subscription key not found error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.error.message).toContain(
        "Access denied due to missing subscription key."
      );
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const before = new Date();
      const requestOptions = {
        uri: `${unifiedUrl}?before=${before.toISOString()}&after=dfgdfggfgf&env=${
          process.env.ENVIRONMENT_DESCRIPTION
        }`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": unifiedAPIKey
        }
      };
      await request(requestOptions).catch(function (body) {
        response = body;
      });
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.error.errorCode).toBe("3");
      expect(response.error.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
      expect(response.error.rawError).toBe(
        "after option must be a valid ISO 8601 date and time ('yyyy-MM-ddTHH:mm:ssZ')"
      );
    });
  });
});
