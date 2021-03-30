require("dotenv").config();
const request = require("request-promise-native");

const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v2/";
const cardiffUrl = `${baseUrl}cardiff`;
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";
const supplierUrl = `${baseUrl}test-supplier`;
const supplierAPIKey = "7e6a81e395cd47ff9e9402e7ccfd5125";
const supplierValidCouncil = "cardiff";
const supplierValidCouncils = "cardiff,bath";

describe("Retrieve all registrations through API", () => {
  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${cardiffUrl}?env=${process.env.NODE_ENV}`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for that council", () => {
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].fsa_rn).toBeDefined();
      expect(response.body[0].collected).toBe(false);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given supplier and valid council", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${supplierUrl}?env=${process.env.NODE_ENV}&local-authorities=${supplierValidCouncil}`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for that council", () => {
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].fsa_rn).toBeDefined();
      expect(response.body[0].collected).toBe(false);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given supplier and no requested councils", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${supplierUrl}?env=${process.env.NODE_ENV}`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for all authorised councils", () => {
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].fsa_rn).toBeDefined();
      expect(response.body[0].collected).toBe(false);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given supplier and multiple valid councils", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${supplierUrl}?env=${process.env.NODE_ENV}&local-authorities=${supplierValidCouncils}`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return all the new registrations for that council", () => {
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].fsa_rn).toBeDefined();
      expect(response.body[0].collected).toBe(false);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given supplier and invalid requested council", () => {
    it("Should return the appropriate error", async () => {
      const requestOptions = {
        uri: `${supplierUrl}?env=${process.env.NODE_ENV}&local-authorities=invalid`,
        json: true,
        resolveWithFullResponse: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      try {
        await request(requestOptions);
      } catch (e) {
        expect(e.statusCode).toBe(400);
        expect(e.message).toContain(
          "requested local-authorities must only contain authorized local authorities"
        );
      }
    });
  });

  describe("Given invalid local authority", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${baseUrl}incorrectAuthority?env=${process.env.NODE_ENV}`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };

      await request(requestOptions).catch(function (body) {
        response = body;
      });
    });

    it("Should return the appropriate error", () => {
      expect(response.statusCode).toBe(403);
      expect(response.error.message).toContain(
        "You are not authorized to access the council"
      );
    });
  });

  describe("Given invalid subscription key", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${cardiffUrl}?env=${process.env.NODE_ENV}`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": "incorrectKey"
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
      const requestOptions = {
        uri: `${cardiffUrl}?env=${process.env.NODE_ENV}`,
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
      const requestOptions = {
        uri: `${cardiffUrl}?new=alskdfj&env=${process.env.NODE_ENV}`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
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
      expect(response.error.rawError).toBe("new option must be a boolean");
    });
  });
});
