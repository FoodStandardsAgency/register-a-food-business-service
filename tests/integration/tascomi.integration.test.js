require("dotenv").config();
const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../src/connectors/tascomi/tascomi.connector");

const auth = {
  url: "url"
};

describe("Tascomi integration: createReferenceNumber", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });
  describe("When given valid request", () => {
    it("Should return reference number and id", async () => {
      const result = await createReferenceNumber("1111", auth);
      const jsonResult = JSON.parse(result);
      expect(jsonResult.id).toBe("1111");
      expect(jsonResult.online_reference).toBe("0001111");
    });
  });

  describe("When given an invalid request", () => {
    it("Should return id of 0", async () => {
      const result = await createReferenceNumber("not an id", auth);
      const jsonResult = JSON.parse(result);
      expect(jsonResult.id).toBe(0);
    });
  });
});

describe("Tascomi integration: createFoodBusinessRegistration", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = true;
  });
  describe("When given valid request", () => {
    it("Should return response with created fields", async () => {
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
        metadata: {
          declaration1: "Declaration",
          declaration2: "Declaration",
          declaration3: "Declaration"
        }
      };
      const result = await createFoodBusinessRegistration(
        registration,
        {
          "fsa-rn": "23589-DHF375",
          hygiene_council_code: 8015
        },
        auth
      );
      const jsonResult = JSON.parse(result);
      expect(jsonResult.fsa_rn).toBe("23589-DHF375");
      expect(jsonResult.owner_email).toBe("operator@email.com");
      expect(jsonResult.accepted).toBe("f");
    });
  });
});
