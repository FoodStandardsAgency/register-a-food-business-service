jest.mock("mongodb");
jest.mock("../../services/logging.service");
const mongodb = require("mongodb");
// const { isISO8601 } = require("validator");

const {
  getUnifiedRegistrations,
  getAllRegistrationsByCouncils,
  getSingleRegistration,
  updateRegistrationCollectedByCouncil
} = require("./registrationsDb.v2.connector");
const { clearCosmosConnection } = require("../cosmos.client");

const fullRegistration = {
  "fsa-rn": "PQQK8Q-SN9N8C-4ADETF",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  reg_submission_date: "2018-10-30T14:51:47.303Z",
  establishment: {
    establishment_trading_name: "Itsu",
    establishment_opening_date: "2018-06-07",
    establishment_primary_number: "329857245",
    establishment_secondary_number: "84345245",
    establishment_email: "django@email.com",
    operator: {
      operator_type: "SOLETRADER",
      operator_company_name: "name",
      operator_company_house_number: null,
      operator_charity_name: null,
      operator_charity_number: null,
      operator_first_name: "Fred",
      operator_last_name: "Bloggs",
      operator_address_line_1: "12",
      operator_address_line_2: "Pie Lane",
      operator_address_line_3: "Test",
      operator_postcode: "SW12 9RQ",
      operator_town: "London",
      operator_primary_number: "9827235",
      operator_secondary_number: null,
      operator_email: "operator@email.com",
      contact_representative_name: null,
      contact_representative_role: null,
      contact_representative_number: null,
      contact_representative_email: null
    },
    activities: {
      customer_type: "END_CONSUMER",
      business_type: "001",
      business_type_search_term: null,
      import_export_activities: "BOTH",
      water_supply: "PUBLIC",
      business_other_details: null,
      opening_days_irregular: null,
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
      establishment_address_line_1: "12",
      establishment_address_line_2: "Street",
      establishment_address_line_3: "Test",
      establishment_town: "London",
      establishment_postcode: "SW12 9RQ",
      establishment_type: "DOMESTIC"
    }
  },
  declaration: {
    declaration1: "Declaration",
    declaration2: "Declaration",
    declaration3: "Declaration"
  },
  hygieneAndStandards: {
    local_council: "City of Cardiff Council"
  },
  local_council_url: "cardiff",
  source_council_id: 8015
};
const shortRegistration = {
  "fsa-rn": "PQQK8Q-SN9N8C-4ADETF",
  collected: false,
  collected_at: "2018-10-30T14:51:47.303Z",
  reg_submission_date: "2018-10-30T14:51:47.303Z",
  establishment: {},
  declaration: {},
  hygieneAndStandards: {
    local_council: "City of Cardiff Council"
  },
  local_council_url: "cardiff",
  source_council_id: 8015
};

let result;
const fsa_rn = "PQQK8Q-SN9N8C-4ADETF";

describe("Function: getSingleRegistration", () => {
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getSingleRegistration(fsa_rn);
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    describe("given no registrations match the fsa-rn and council", () => {
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              findOne: () => null
            })
          })
        }));
        try {
          await getSingleRegistration(fsa_rn);
        } catch (err) {
          result = err;
        }
      });

      it("should return a getRegistrationNotFoundError", () => {
        expect(result.name).toBe("getRegistrationNotFoundError");
        expect(result.message).toBe("getRegistrationNotFoundError");
      });
    });

    describe("given a record is found", () => {
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              findOne: () => fullRegistration
            })
          })
        }));
        result = await getSingleRegistration(fsa_rn);
      });

      it("should return the projected data", () => {
        expect(result).toBe(fullRegistration);
      });
    });
  });
});

describe("Function: getUnifiedRegistrations", () => {
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getUnifiedRegistrations(
          "2018-10-30T23:59:59Z",
          "2018-10-25T09:00:00Z"
        );
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    let results;
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            find: () => ({
              toArray: () => {
                return [{ "fsa-rn": fsa_rn }];
              }
            }),
            findOne: () => fullRegistration
          })
        })
      }));
      results = await getUnifiedRegistrations(
        "2018-10-30T23:59:59Z",
        "2018-10-25T09:00:00Z"
      );
    });
    it("should return full registrations", () => {
      expect(results).toStrictEqual([fullRegistration]);
    });
  });
});

describe("Function: getAllRegistrationsByCouncils", () => {
  const councils = ["cardiff"];
  const newRegistrations = "true";
  const before = "2018-10-30T23:59:59Z";
  const after = "2018-10-25T09:00:00Z";
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getAllRegistrationsByCouncils(
          councils,
          newRegistrations,
          [],
          before,
          after
        );
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    describe("without fields specified", () => {
      let results;
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              find: () => ({
                toArray: () => {
                  return [{ "fsa-rn": fsa_rn }];
                }
              }),
              findOne: () => shortRegistration
            })
          })
        }));
        results = await getAllRegistrationsByCouncils(
          councils,
          newRegistrations,
          [],
          before,
          after
        );
      });
      it("should return full registrations", () => {
        expect(results).toStrictEqual([shortRegistration]);
      });
    });
    describe("with fields specified", () => {
      let results;
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              find: () => ({
                toArray: () => {
                  return [{ "fsa-rn": fsa_rn }];
                }
              }),
              findOne: () => fullRegistration
            })
          })
        }));
        results = await getAllRegistrationsByCouncils(
          councils,
          newRegistrations,
          ["establishment", "metadata"],
          before,
          after
        );
      });
      it("should return full registrations", () => {
        expect(results).toStrictEqual([fullRegistration]);
      });
    });
    describe("with new registrations set to false", () => {
      let results;
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              find: () => ({
                toArray: () => {
                  return [{ "fsa-rn": fsa_rn }];
                }
              }),
              findOne: () => shortRegistration
            })
          })
        }));
        results = await getAllRegistrationsByCouncils(
          councils,
          "false",
          [],
          before,
          after
        );
      });
      it("should return full registrations", () => {
        expect(results).toStrictEqual([shortRegistration]);
      });
    });
  });
});

describe("Function: updateRegistrationCollectedByCouncil", () => {
  const collected = true;
  const council = "cardiff";
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await updateRegistrationCollectedByCouncil(fsa_rn, collected, council);
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    describe("given no registration is found", () => {
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              updateOne: () => ({ result: { n: 0 } })
            })
          })
        }));
        try {
          await updateRegistrationCollectedByCouncil(
            fsa_rn,
            collected,
            council
          );
        } catch (err) {
          result = err;
        }
      });
      it("should return a getRegistrationNotFoundError", () => {
        expect(result.name).toBe("updateRegistrationNotFoundError");
        expect(result.message).toBe("updateRegistrationNotFoundError");
      });
    });
    describe("given a registration is found and updated", () => {
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              updateOne: () => ({ result: { n: 1 } })
            })
          })
        }));
        result = await updateRegistrationCollectedByCouncil(
          fsa_rn,
          collected,
          council
        );
      });
      it("should return full registrations", () => {
        expect(result).toStrictEqual({ fsa_rn, collected });
      });
    });
  });
});
