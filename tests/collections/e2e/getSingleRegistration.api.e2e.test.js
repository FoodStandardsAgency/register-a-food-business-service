require("dotenv").config();
const fetch = require("node-fetch");

const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v1/";
const cardiffUrl = `${baseUrl}cardiff`;
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";

describe("Get single registration through API", () => {
  let availableRegistrations;
  beforeAll(async () => {
    const requestOptions = {
      json: true,
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": cardiffAPIKey
      }
    };
    const res = await fetch(
      `${cardiffUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
      requestOptions
    );
    availableRegistrations = await res.json();
  });

  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const update = {
        json: true,
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = await res.json();
    });

    it("should return the requested new registration for that council", () => {
      expect(response.fsa_rn).toBe(availableRegistrations[0].fsa_rn);
      expect(response.establishment).toBeDefined();
      expect(response.establishment.operator).toBeDefined();
      expect(response.establishment.premise).toBeDefined();
      expect(response.establishment.establishment_web_address).toBe(undefined);
      expect(response.metadata).toBeDefined();
    });
  });

  describe("Given invalid subscription key", () => {
    it("should return a subscription incorrect error", async () => {
      const requestOptions = {
        method: "get",
        json: true,
        headers: {
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        }
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      let response = await res.json();
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("invalid subscription key.");
    });
  });
});
