require("dotenv").config();
const fetch = require("node-fetch");

const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v3/";
const cardiffUrl = `${baseUrl}cardiff`;
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";

describe("Update single registration through API", () => {
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        body: JSON.stringify({
          collected: true
        })
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = await res.json();
    });

    it("should return the updated object with collected true", () => {
      expect(response.fsa_rn).toBe(availableRegistrations[0].fsa_rn);
      expect(response.collected).toBe(true);
    });
  });

  describe("Given invalid body", () => {
    let response;
    beforeEach(async () => {
      const update = {
        json: true,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        body: JSON.stringify({
          incorrect: true
        })
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = await res.json();
    });

    it("Should throw an error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.developerMessage).toBe(
        "One of the supplied options is invalid"
      );
    });
  });

  describe("Given a false for flag collected in body", () => {
    let response;
    beforeEach(async () => {
      const update = {
        json: true,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        body: JSON.stringify({
          collected: false
        })
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = await res.json();
    });

    it("should return false for collected flag", () => {
      expect(response.fsa_rn).toBe(availableRegistrations[0].fsa_rn);
      expect(response.collected).toBe(false);
    });
  });

  describe("Given invalid subscription key", () => {
    let response;
    beforeEach(async () => {
      const update = {
        json: true,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        },
        body: JSON.stringify({
          collected: true
        })
      };
      const res = await fetch(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = await res.json();
    });

    it("should return a subscription incorrect error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("invalid subscription key.");
    });
  });
});
