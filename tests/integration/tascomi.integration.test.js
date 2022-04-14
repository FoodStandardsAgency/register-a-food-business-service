require("dotenv").config();
const {
  createFoodBusinessRegistration,
  createReferenceNumber
} = require("../../src/connectors/tascomi/tascomi.connector");

const auth = {
  url: "url"
};

// This needs to be mocked as jest fails if something else imports request-promise
// Issue: https://github.com/request/request-promise/issues/247
jest.mock("../../src/services/statusEmitter.service");

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
            establishment_web_address: "test.com",
            establishment_opening_date: "2018-06-07"
          },
          operator: {
            operator_first_name: "Fred",
            operator_last_name: "Bloggs",
            operator_postcode: "SW12 9RQ",
            operator_address_line_1: "335",
            operator_address_line_2: "Some St.",
            operator_address_line_3: "Locality",
            operator_town: "London",
            operator_primary_number: "9827235",
            operator_email: "operator@email.com",
            operator_type: "Sole trader",
            partners: []
          },
          premise: {
            establishment_postcode: "SW12 9RQ",
            establishment_address_line_1: "123",
            establishment_address_line_2: "Street",
            establishment_address_line_3: "Locality",
            establishment_town: "London",
            establishment_type: "somewhere"
          },
          activities: {
            customer_type: "End consumer",
            import_export_activities: "t",
            water_supply: "Public",
            opening_day_monday: "t",
            opening_day_tuesday: "t",
            opening_day_wednesday: "t",
            opening_day_thursday: "t",
            opening_day_friday: "t",
            opening_day_saturday: "t",
            opening_day_sunday: "t",
            opening_hours_monday: "9:30 - 19:00",
            opening_hours_tuesday: "09:30 - 19:00",
            opening_hours_wednesday: "9:30am - 7pm",
            opening_hours_thurday: "0930 - 1900",
            opening_hours_friday: "9:30 to 19:00",
            opening_hours_saturday: "09:30 to 19:00",
            opening_hours_sunday: "From 9:30 to 19:00"
          }
        },
        declaration: {
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
