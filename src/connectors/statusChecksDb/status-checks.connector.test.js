jest.mock("mongodb");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  },
  ERROR: "error"
}));

const mongodb = require("mongodb");
const {
  findActionableRegistrations,
  updateRegistrationTradingStatus,
  updateNextStatusDate,
  updateTradingStatusCheck,
  findRegistrationByFsaId
} = require("./status-checks.connector");
const { logEmitter } = require("../../services/logging.service");
const { clearCosmosConnection } = require("../cosmos.client");

describe("status-checks.connector", () => {
  let mockRegistrations;
  let result;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock data
    mockRegistrations = [
      { "fsa-rn": "1234", next_status_date: new Date(), trading_status: "active" },
      { "fsa-rn": "5678", next_status_date: new Date(), trading_status: "active" }
    ];
  });

  describe("findActionableRegistrations", () => {
    describe("given the request is successful", () => {
      beforeEach(async () => {
        clearCosmosConnection();

        // Setup the MongoDB client mock
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              find: () => ({
                limit: () => ({
                  toArray: () => mockRegistrations
                })
              })
            })
          })
        }));

        result = await findActionableRegistrations();
      });

      it("should return actionable registrations", () => {
        expect(result).toEqual(mockRegistrations);
      });

      it("should log function call and success", () => {
        expect(logEmitter.emit).toHaveBeenCalledWith(
          "functionCall",
          "status-checks.connector",
          "findActionableRegistrations"
        );
        expect(logEmitter.emit).toHaveBeenCalledWith(
          "functionSuccess",
          "status-checks.connector",
          "findActionableRegistrations"
        );
      });
    });

    describe("given the request throws an error", () => {
      beforeEach(async () => {
        clearCosmosConnection();
        mongodb.MongoClient.connect.mockImplementation(() => {
          throw new Error("Database connection failed");
        });

        try {
          await findActionableRegistrations();
        } catch (err) {
          result = err;
        }
      });

      it("should throw an error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("Database connection failed");
      });

      it("should log the error", () => {
        expect(logEmitter.emit).toHaveBeenCalledWith("error", "Registration data lookup failure");
        expect(logEmitter.emit).toHaveBeenCalledWith(
          "functionFail",
          "status-checks.connector",
          "findActionableRegistrations",
          expect.any(Error)
        );
      });
    });
  });

  describe("updateRegistrationTradingStatus", () => {
    it("should update the registration to stopped trading", async () => {
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await updateRegistrationTradingStatus("1234", true);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        {
          $set: {
            confirmed_not_trading: expect.any(Date),
            next_status_check: expect.any(Date)
          }
        }
      );
    });

    it("should update the registration to confirmed still trading", async () => {
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await updateRegistrationTradingStatus("1234", false);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        {
          $set: {
            confirmed_not_trading: null,
            next_status_check: expect.any(Date),
            last_confirmed_trading: expect.any(Date)
          }
        }
      );
    });

    it("should throw an error if registration is not found", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne
          })
        })
      }));

      await expect(updateRegistrationTradingStatus("1234", true)).rejects.toThrow(
        "Registration with ID 1234 not found"
      );
    });
  });

  describe("updateNextStatusDate", () => {
    it("should update the next_status_date field", async () => {
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await updateNextStatusDate("1234", new Date());

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        { $set: { next_status_date: expect.any(Date) } }
      );
    });

    it("should throw an error if registration is not found", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne
          })
        })
      }));

      await expect(updateNextStatusDate("1234", new Date())).rejects.toThrow(
        "Registration with ID 1234 not found"
      );
    });
  });

  describe("findRegistrationByFsaId", () => {
    it("should find a registration by FSA ID", async () => {
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne
          })
        })
      }));

      const result = await findRegistrationByFsaId("1234");

      expect(result).toEqual({ "fsa-rn": "1234" });
      expect(mockFindOne).toHaveBeenCalledWith({ "fsa-rn": "1234" });
    });

    it("should throw an error if registration is not found", async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne
          })
        })
      }));

      const result = await findRegistrationByFsaId("1234");

      expect(result).toBeNull();
    });
  });
});
