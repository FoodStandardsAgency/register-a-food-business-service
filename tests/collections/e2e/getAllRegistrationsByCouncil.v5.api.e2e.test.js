require("dotenv").config();
const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const baseUrl = "https://integration-fsa-rof-gateway.azure-api.net/registrations/v5/";
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
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };
      const res = await axios(
        `${cardiffUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return all the new registrations for that council", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
      expect(response[0].fsa_rn).toBeDefined();
      expect(response[0].collected).toBe(false);
    });
  });

  describe("Given supplier and valid council", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      const res = await axios(
        `${supplierUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}&local-authorities=${supplierValidCouncil}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return all the new registrations for that council", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
      expect(response[0].fsa_rn).toBeDefined();
      expect(response[0].collected).toBe(false);
    });
  });

  describe("Given supplier and no requested councils", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      const res = await axios(
        `${supplierUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return all the new registrations for all authorised councils", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
      expect(response[0].fsa_rn).toBeDefined();
      expect(response[0].collected).toBe(false);
    });
  });

  describe("Given supplier and multiple valid councils", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      const res = await axios(
        `${supplierUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}&local-authorities=${supplierValidCouncils}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return all the new registrations for that council", () => {
      expect(response.length).toBeGreaterThanOrEqual(1);
      expect(response[0].fsa_rn).toBeDefined();
      expect(response[0].collected).toBe(false);
    });
  });

  describe("Given supplier and invalid requested council", () => {
    it("Should return the appropriate error", async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": supplierAPIKey
        }
      };
      const res = await axios(
        `${supplierUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}&local-authorities=invalid`,
        requestOptions
      );
      const response = res.data;
      expect(response.statusCode).toBe(400);
      expect(response.developerMessage).toContain("One of the supplied options is invalid");
    });
  });

  describe("Given invalid local authority", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };

      const res = await axios(
        `${baseUrl}incorrectAuthority?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("Should return the appropriate error", () => {
      expect(response.statusCode).toBe(403);
      expect(response.message).toContain("You are not authorized to access the council");
    });
  });

  describe("Given invalid subscription key", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        }
      };
      const res = await axios(
        `${cardiffUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
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
      const res = await axios(`${cardiffUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`);
      response = res.data;
    });

    it("Should return subscription key not found error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("Access denied due to missing subscription key.");
    });
  });

  describe("Given invalid parameters", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        }
      };
      const res = await axios(
        `${cardiffUrl}?new=alskdfj&env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return the options validation error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe("One of the supplied options is invalid");
      expect(response.rawError).toBe("new option must be a boolean");
    });
  });
});
