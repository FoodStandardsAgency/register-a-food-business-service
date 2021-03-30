require("dotenv").config();
const request = require("request-promise-native");

const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v2/";
const cardiffUrl = `${baseUrl}cardiff`;
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";
const supplierUrl = `${baseUrl}test-supplier`;
const supplierAPIKey = "7e6a81e395cd47ff9e9402e7ccfd5125";
const supplierValidCouncils = "cardiff";

describe("Get single registration through API", () => {
  let availableRegistrations;
  beforeAll(async () => {
    const requestOptions = {
      uri: `${cardiffUrl}?env=${process.env.NODE_ENV}`,
      json: true,
      headers: {
        "Ocp-Apim-Subscription-Key": cardiffAPIKey
      }
    };
    availableRegistrations = await request(requestOptions);
  });

  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const update = {
        uri: `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.NODE_ENV}`,
        json: true,
        method: "get",
        headers: {
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };
      response = await request(update);
    });

    it("should return the requested new registration for that council", () => {
      expect(response.fsa_rn).toBe(availableRegistrations[0].fsa_rn);
      expect(response.establishment).toBeDefined();
      expect(response.establishment.operator).toBeDefined();
      expect(response.establishment.premise).toBeDefined();
      expect(response.metadata).toBeDefined();
    });
  });

  describe("Given supplier and valid council", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        uri: `${supplierUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.NODE_ENV}&local-authority=${supplierValidCouncils}`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      response = await request(requestOptions);
    });

    it("should return the requested new registration for that council", () => {
      expect(response.fsa_rn).toBe(availableRegistrations[0].fsa_rn);
      expect(response.establishment).toBeDefined();
      expect(response.establishment.operator).toBeDefined();
      expect(response.establishment.premise).toBeDefined();
      expect(response.metadata).toBeDefined();
    });
  });

  describe("Given supplier and invalid requested council", () => {
    let response;

    it("Should return the appropriate error", async () => {
      const requestOptions = {
        uri: `${supplierUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.NODE_ENV}&local-authority=invalid`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };

      try {
        response = await request(requestOptions);
      } catch (e) {
        expect(e.statusCode).toBe(400);
        expect(e.message).toContain(
          "requested local-authorities must only contain authorized local authorities"
        );
      }
    });
  });

  describe("Given invalid subscription key", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        method: "put",
        uri: `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.NODE_ENV}`,
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        },
        body: {
          collected: true
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
});
