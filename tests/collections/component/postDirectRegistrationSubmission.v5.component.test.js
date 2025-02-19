require("dotenv").config();
const ax = require("axios");
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const baseUrl = process.env.SERVICE_BASE_URL || "http://localhost:4000";
const directSubmitUrl = `${baseUrl}/api/submissions/v5/createNewDirectRegistration/cardiff`;
const collectUrl = `${baseUrl}/api/v5/collections/cardiff`;

const registration = {
  establishment: {
    establishment_trading_name: "The Reach",
    establishment_additional_trading_names: ["The Reach 1", "The Reach 2"],
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_email: "test@email.com",
    operator: {
      operator_type: "SOLETRADER",
      operator_first_name: "Loras",
      operator_last_name: "Tyrell",
      operator_birthdate: "1990-02-05",
      operator_address_line_1: "12",
      operator_address_line_2: "Pie Lane",
      operator_address_line_3: "Test",
      operator_postcode: "SW12 9RQ",
      operator_town: "Westeros",
      operator_primary_number: "9827235",
      operator_email: "Garth@thegardener.com",
      operator_uprn: "123456789"
    },
    activities: {
      business_type: "005",
      business_scale: ["NATIONAL", "LOCAL", "FBO"],
      food_type: ["READY_TO_EAT", "IMPORTED"],
      processing_activities: ["REWRAPPING_OR_RELABELLING"],
      water_supply: "PUBLIC",
      opening_day_monday: true,
      opening_day_tuesday: true,
      opening_day_wednesday: true,
      opening_day_thursday: true,
      opening_day_friday: true,
      opening_day_saturday: true,
      opening_day_sunday: true,
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thursday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    },
    premise: {
      establishment_address_line_1: "6 Eastfield Road",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Test",
      establishment_town: "London",
      establishment_postcode: "BS249ST",
      establishment_type: "DOMESTIC"
    }
  }
};

const registrationWithFSARN = {
  fsa_rn: "E6TYYT-CRC6L0-J0JD38",
  establishment: {
    establishment_trading_name: "The Reach",
    establishment_additional_trading_names: ["The Reach 1", "The Reach 2"],
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_email: "test@email.com",
    operator: {
      operator_type: "SOLETRADER",
      operator_first_name: "Loras",
      operator_last_name: "Tyrell",
      operator_birthdate: "1990-02-05",
      operator_address_line_1: "12",
      operator_address_line_2: "Pie Lane",
      operator_address_line_3: "Test",
      operator_postcode: "SW12 9RQ",
      operator_town: "Westeros",
      operator_primary_number: "9827235",
      operator_email: "Garth@thegardener.com",
      operator_uprn: "123456789"
    },
    activities: {
      business_type: "005",
      business_scale: ["NATIONAL", "LOCAL", "FBO"],
      food_type: ["READY_TO_EAT", "IMPORTED"],
      processing_activities: ["REWRAPPING_OR_RELABELLING"],
      water_supply: "PUBLIC",
      opening_day_monday: true,
      opening_day_tuesday: true,
      opening_day_wednesday: true,
      opening_day_thursday: true,
      opening_day_friday: true,
      opening_day_saturday: true,
      opening_day_sunday: true,
      opening_hours_monday: "9:30 - 19:00",
      opening_hours_tuesday: "09:30 - 19:00",
      opening_hours_wednesday: "9:30am - 7pm",
      opening_hours_thursday: "0930 - 1900",
      opening_hours_friday: "9:30 to 19:00",
      opening_hours_saturday: "09:30 to 19:00",
      opening_hours_sunday: "From 9:30 to 19:00"
    },
    premise: {
      establishment_address_line_1: "6 Eastfield Road",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Test",
      establishment_town: "London",
      establishment_postcode: "BS249ST",
      establishment_type: "DOMESTIC"
    }
  }
};

describe("Submit a single registration through the API as a council", () => {
  describe("Given correct URL,headers and body but no FSA-RN defined", () => {
    let postResponse;
    let getResponse;
    beforeAll(async () => {
      //Submit registration to registration API.
      const postRequestOptions = {
        data: registration,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(directSubmitUrl, postRequestOptions);
      postResponse = res.data;

      //Retrieve registration from collections service
      const getRequestOptions = {
        json: true,
        method: "get"
      };
      const response = await axios(`${collectUrl}/${postResponse["fsa-rn"]}`, getRequestOptions);
      getResponse = response.data;
    });

    it("should successfully submit the registration and return a fsa-rn", () => {
      expect(postResponse["fsa-rn"]).toBeDefined();
    });
    it("should be retrievable through the collections API", () => {
      expect(getResponse.fsa_rn).toBe(postResponse["fsa-rn"]);
      expect(getResponse.establishment).toBeDefined();
      expect(getResponse.establishment.operator.operator_first_name).toBe(
        registration.establishment.operator.operator_first_name
      );
      expect(getResponse.establishment.operator.operator_birthdate).toBe(
        registration.establishment.operator.operator_birthdate
      );
      expect(getResponse.establishment.activities.water_supply).toBe(
        registration.establishment.activities.water_supply
      );
      expect(getResponse.establishment.activities.processing_activities).toEqual(
        registration.establishment.activities.processing_activities
      );
      expect(getResponse.establishment.activities.food_type).toEqual(
        registration.establishment.activities.food_type
      );
      expect(getResponse.establishment.activities.business_scale).toEqual(
        registration.establishment.activities.business_scale
      );
      expect(getResponse.establishment.premise.establishment_town).toBe(
        registration.establishment.premise.establishment_town
      );
      expect(getResponse.metadata).toBeDefined();
    });
  });

  describe("Given correct URL,headers, body and a FSA-RN defined", () => {
    let postResponse;
    let getResponse;
    beforeAll(async () => {
      //Submit registration to registration API.
      const postRequestOptions = {
        data: registrationWithFSARN,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };
      var res = await axios(directSubmitUrl, postRequestOptions);
      postResponse = res.data;
      //Retrieve registration from collections service
      res = await axios(`${collectUrl}/${postResponse["fsa-rn"]}`);
      getResponse = res.data;
    });

    it("should successfully submit the registration and return a fsa-rn", () => {
      expect(postResponse["fsa-rn"]).toBe(registrationWithFSARN.fsa_rn);
    });
    it("should be retrievable through the collcetions API", () => {
      expect(getResponse.fsa_rn).toBe(postResponse["fsa-rn"]);
      expect(getResponse.establishment).toBeDefined();
      expect(getResponse.establishment.operator.operator_first_name).toBe(
        registration.establishment.operator.operator_first_name
      );
      expect(getResponse.establishment.activities.water_supply).toBe(
        registration.establishment.activities.water_supply
      );
      expect(getResponse.establishment.premise.establishment_town).toBe(
        registration.establishment.premise.establishment_town
      );
      expect(getResponse.metadata).toBeDefined();
    });
  });

  describe("Given an invalid fsa_rn is used", () => {
    it("should return an invalid FSA-RN error", async () => {
      let registrationWithInvalidFSARN = registrationWithFSARN;
      registrationWithInvalidFSARN.fsa_rn = "E6TYYT-CRC6L0-J0JD";
      const postRequestOptions = {
        data: registrationWithInvalidFSARN,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.userMessages[0].message).toContain("Invalid FSA Reference Number");
    });
  });

  describe("Given the council is not found", () => {
    it("should return a no council match error", async () => {
      const postRequestOptions = {
        data: registration,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(
        `${baseUrl}/api/submissions/v5/createNewDirectRegistration/unknown`,
        postRequestOptions
      );
      const response = res.data;
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("13");
      expect(response.developerMessage).toContain(
        "The local council has not matched any records in the config database"
      );
    });
  });

  describe("Given the api-secret is wrong", () => {
    it("should return a secret not found incorrect error", async () => {
      const postRequestOptions = {
        data: registration,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": "Wr0NG"
        }
      };
      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(403);
      expect(response.errorCode).toBe("11");
      expect(response.developerMessage).toContain("Secret is invalid");
    });
  });

  describe("Given the api-secret is missing", () => {
    it("should return a secret not found error", async () => {
      const postRequestOptions = {
        data: registration,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME
        }
      };
      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(403);
      expect(response.errorCode).toBe("8");
      expect(response.developerMessage).toContain("Client secret not found");
    });
  });

  describe("Given the client-name is wrong", () => {
    it("should return a client not supported error", async () => {
      const postRequestOptions = {
        data: registration,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": "wrong-name",
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(403);
      expect(response.errorCode).toBe("10");
      expect(response.developerMessage).toContain("Client not supported");
    });
  });

  describe("Given the client-name is missing", () => {
    it("should return a client not found error", async () => {
      const postRequestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(403);
      expect(response.errorCode).toBe("9");
      expect(response.developerMessage).toContain("Client not found");
    });
  });

  describe("Given the registration body is invalid", () => {
    it("should return a validation error", async () => {
      const postRequestOptions = {
        data: {},
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-name": process.env.DIRECT_API_NAME,
          "api-secret": process.env.DIRECT_API_SECRET
        }
      };

      const res = await axios(directSubmitUrl, postRequestOptions);
      const response = res.data;
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe("3");
      expect(response.developerMessage).toBe(
        "Validation error, check request body vs validation schema"
      );
    });
  });
});
