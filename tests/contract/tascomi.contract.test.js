require("dotenv").config();
const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../src/connectors/tascomi/tascomi.connector");

const realAuth = {
  url: process.env.TASCOMI_URL,
  public_key: process.env.TASCOMI_PUBLIC_KEY,
  private_key: process.env.TASCOMI_PRIVATE_KEY
};

const auth = {
  url: "url"
};

describe("Tascomi contract: createReferenceNumber", () => {
  describe("When given valid request", () => {
    it("Should return same resposne", async () => {
      process.env.DOUBLE_MODE = true;
      const doubleResult = await createReferenceNumber("1234", auth);
      const doubleJson = JSON.parse(doubleResult);
      process.env.DOUBLE_MODE = false;
      const realResult = await createReferenceNumber("1234", realAuth);
      const realJson = JSON.parse(realResult);
      expect(doubleJson).toEqual(realJson);
    });
  });

  describe("When given invalid request", () => {
    it("Should return same response", async () => {
      process.env.DOUBLE_MODE = true;
      const doubleResult = await createReferenceNumber("not an id", auth);
      const doubleJson = JSON.parse(doubleResult);
      process.env.DOUBLE_MODE = false;
      const realResult = await createReferenceNumber("not an id", realAuth);
      const realJson = JSON.parse(realResult);
      expect(doubleJson).toEqual(realJson);
    });
  });
});

describe("Tascomi contract: createFoodBusinessRegistration", () => {
  describe("When given valid request", () => {
    it("Should return same resposne", async () => {
      const registration = {
        establishment: {
          establishment_details: {
            establishment_trading_name: "Itsu",
            establishment_primary_number: "329857245",
            establishment_secondary_number: "84345245",
            establishment_email: "django@uk.ibm.com",
            establishment_opening_date: "2018-06-07"
          },
          operator: {
            operator_first_name: "Fred",
            operator_last_name: "Bloggs",
            operator_postcode: "SW12 9RQ",
            operator_first_line: "335",
            operator_street: "Some St.",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "operator@email.com",
            operator_type: "Sole trader"
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_first_line: "123",
            establishment_street: "Street",
            establishment_town: "London",
            establishment_type: "somewhere"
          },
          activities: {
            customer_type: "End consumer"
          }
        },
        declaration: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      };
      process.env.DOUBLE_MODE = true;
      const doubleResult = await createFoodBusinessRegistration(
        registration,
        {
          "fsa-rn": "23589-DHF375",
          hygiene_council_code: 8015
        },
        auth
      );
      const doubleJson = JSON.parse(doubleResult);
      process.env.DOUBLE_MODE = false;
      const realResult = await createFoodBusinessRegistration(
        registration,
        {
          "fsa-rn": "23589-DHF375",
          hygiene_council_code: 8015
        },
        realAuth
      );
      const realJson = JSON.parse(realResult);
      expect(doubleJson.owner_email).toEqual(realJson.owner_email);
      expect(doubleJson.fsa_rn).toEqual(realJson.fsa_rn);
    });
  });
});
