require("dotenv").config();
const ax = require("axios").default;
const axios = ax.create({
  validateStatus: () => {
    return true;
  }
});
const baseUrl =
  "https://integration-fsa-rof-gateway.azure-api.net/registrations/v3/";
const highgardenUrl = `${baseUrl}highgarden`;
const highgardenAPIKey = "414d6fb61355434694c6a9fcd600e9e4";
const cardiffAPIKey = "b175199d420448fc87baa714e458ce6e";

const registration = {
  establishment: {
    establishment_trading_name: "The Reach",
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_email: "test@email.com",
    operator: {
      operator_type: "SOLE_TRADER",
      operator_first_name: "Loras",
      operator_last_name: "Tyrell",
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
      customer_type: "END_CONSUMER",
      business_type: "005",
      import_export_activities: "NONE",
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
  describe("Given correct URL,headers and body", () => {
    let postResponse;
    let getResponse;
    beforeAll(async () => {
      //Submit registration to registration API.
      const postRequestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": highgardenAPIKey
        },
        data: registration
      };
      let res = await axios(
        `${highgardenUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        postRequestOptions
      );
      postResponse = res.data;
      //Retrieve registration from collections service
      const getRequestOptions = {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": highgardenAPIKey
        }
      };
      res = await axios(
        `${highgardenUrl}/${postResponse["fsa-rn"]}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        getRequestOptions
      );
      getResponse = res.data;
    });

    it("should successfully submit the registration and return a fsa-rn", () => {
      expect(postResponse["fsa-rn"]).toBeDefined();
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

  describe("Given invalid subscription key header", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "incorrectKey"
        },
        data: registration
      };
      const res = await axios(
        `${highgardenUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return a subscription incorrect error", () => {
      expect(response.statusCode).toBe(401);
      expect(response.message).toContain("invalid subscription key");
    });
  });

  describe("Given a valid subscription key for the wrong council", () => {
    let response;
    const purbeckUrl = `${baseUrl}purbeck`;
    beforeEach(async () => {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": cardiffAPIKey
        },
        data: registration
      };
      const res = await axios(
        `${purbeckUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return an authorization error", () => {
      expect(response.statusCode).toBe(403);
      expect(response.message).toContain(
        "You are not authorized to access the council:"
      );
    });
  });

  describe("Given an invalid registration body", () => {
    let response;
    beforeEach(async () => {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": highgardenAPIKey
        },
        data: {}
      };
      const res = await axios(
        `${highgardenUrl}?env=${process.env.ENVIRONMENT_DESCRIPTION}`,
        requestOptions
      );
      response = res.data;
    });

    it("should return a schema error", () => {
      expect(response.statusCode).toBe(400);
      expect(response.developerMessage).toBe(
        "Validation error, check request body vs validation schema"
      );
    });
  });
});
