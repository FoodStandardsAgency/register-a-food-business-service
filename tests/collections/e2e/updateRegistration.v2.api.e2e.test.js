require("dotenv").config();
const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v2/";
const cardiffUrl = `${baseUrl}cardiff`;
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";

describe("Update single registration through API", () => {
  let availableRegistrations;
  beforeAll(async () => {
    const requestOptions = {
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": cardiffAPIKey
      }
    };
    const res = await axios(
      `${cardiffUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
      requestOptions
    );
    availableRegistrations = res.data;
  });

  describe("Given no extra parameters", () => {
    let response;
    beforeEach(async () => {
      const update = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        data: {
          collected: true
        }
      };
      const res = await axios(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = res.data;
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        data: {
          incorrect: true
        }
      };
      const res = await axios(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = res.data;
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        data: {
          collected: false
        }
      };
      const res = await axios(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = res.data;
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        },
        data: {
          collected: true
        }
      };
      const res = await axios(
        `${cardiffUrl}/${availableRegistrations[0].fsa_rn}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        update
      );
      response = res.data;
    });

    it("should return a subscription incorrect error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("invalid subscription key.");
    });
  });
});
