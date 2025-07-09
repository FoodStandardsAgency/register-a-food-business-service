jest.mock("mongodb");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  },
  ERROR: "error"
}));
jest.mock("../../utils/crypto", () => ({
  decryptId: jest.fn((id) => id)
}));

const moment = require("moment");
const mongodb = require("mongodb");
const {
  findActionableRegistrations,
  updateRegistrationTradingStatus,
  updateNextStatusDate,
  updateTradingStatusCheck,
  findRegistrationByFsaId,
  deleteRegistration
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
      { "fsa-rn": "1234", next_status_check: new Date(), trading_status: "active" },
      { "fsa-rn": "5678", next_status_check: new Date(), trading_status: "active" }
    ];
  });
  describe("updateTradingStatusCheck", () => {
    it("should add a new status check when none exists", async () => {
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({
        "fsa-rn": "1234",
        _id: "test:Id",
        status: {}
      });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      const newStatus = { type: "email", timestamp: new Date() };
      await updateTradingStatusCheck("1234", newStatus);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        { $set: { "status.trading_status_checks": [newStatus] } },
        { upsert: true }
      );
    });

    it("should replace an existing status of the same type", async () => {
      const oldStatus = { type: "email", timestamp: new Date(2020, 1, 1) };
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({
        "fsa-rn": "1234",
        _id: "test:Id",
        status: {
          trading_status_checks: [oldStatus]
        }
      });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      const newStatus = { type: "email", timestamp: new Date() };
      await updateTradingStatusCheck("1234", newStatus);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        { $set: { [`status.trading_status_checks.0`]: newStatus } }
      );
    });

    it("should add a new status of a different type", async () => {
      const existingStatus = { type: "email", timestamp: new Date(2020, 1, 1) };
      const mockUpdateOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({
        "fsa-rn": "1234",
        _id: "test:Id",
        status: {
          trading_status_checks: [existingStatus]
        }
      });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      const newStatus = { type: "phone", timestamp: new Date() };
      await updateTradingStatusCheck("1234", newStatus);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        { $push: { "status.trading_status_checks": newStatus } }
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

      await expect(updateTradingStatusCheck("1234", { type: "email" })).rejects.toThrow(
        "Registration with ID 1234 not found"
      );
    });
  });

  describe("updateNextStatusDate additional tests", () => {
    it("should remove the next_status_check field when nextStatusDate is null", async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await updateNextStatusDate("1234", null);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { "fsa-rn": "1234" },
        { $unset: { next_status_check: "" } }
      );
    });

    it("should throw an error when no document matched for unset operation", async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await expect(updateNextStatusDate("1234", null)).rejects.toThrow(
        "No document matched for fsa-rn: 1234"
      );
    });

    it("should throw an error when document found but field not modified", async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne
          })
        })
      }));

      await expect(updateNextStatusDate("1234", null)).rejects.toThrow(
        "Document found but field not modified for fsa-rn: 1234"
      );
    });
  });

  describe("deleteRegistration", () => {
    it("should delete a registration by FSA ID", async () => {
      const mockDeleteOne = jest.fn();
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            deleteOne: mockDeleteOne
          })
        })
      }));

      await deleteRegistration("1234");

      expect(mockDeleteOne).toHaveBeenCalledWith({ "fsa-rn": "1234" });
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionSuccess",
        "status-checks.connector",
        "deleteRegistration"
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

      await expect(deleteRegistration("1234")).rejects.toThrow(
        "Registration with ID 1234 not found"
      );
    });

    it("should log an error if deletion fails", async () => {
      const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });
      const mockDeleteOne = jest.fn().mockImplementation(() => {
        throw new Error("Deletion failed");
      });

      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: mockFindOne,
            deleteOne: mockDeleteOne
          })
        })
      }));

      try {
        await deleteRegistration("1234");
      } catch (err) {
        expect(err.message).toBe("Deletion failed");
      }

      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionFail",
        "status-checks.connector",
        "deleteRegistration",
        expect.any(Error)
      );
    });
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

describe("updateRegistrationTradingStatus", () => {
  it("should update the registration to stopped trading", async () => {
    const mockUpdateOne = jest.fn();
    const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: mockFindOne,
          updateOne: mockUpdateOne
        })
      })
    }));

    await updateRegistrationTradingStatus("1234", "test:Id", true);

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
    const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: mockFindOne,
          updateOne: mockUpdateOne
        })
      })
    }));

    await updateRegistrationTradingStatus("1234", "test:Id", false);

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

    await expect(updateRegistrationTradingStatus("1234", "test:Id", true)).rejects.toThrow(
      "Registration with ID 1234 not found"
    );
  });

  it("should throw an error if token does not match ID", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: mockFindOne
        })
      })
    }));

    await expect(updateRegistrationTradingStatus("1234", "nomatch", true)).rejects.toThrow(
      "Invalid encrypted ID: nomatch"
    );
  });
});

describe("updateNextStatusDate", () => {
  it("should update the next_status_check field", async () => {
    const mockUpdateOne = jest.fn();
    const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: mockFindOne,
          updateOne: mockUpdateOne
        })
      })
    }));

    await updateNextStatusDate("1234", moment());

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { "fsa-rn": "1234" },
      { $set: { next_status_check: expect.any(Date) } }
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
    const mockFindOne = jest.fn().mockResolvedValue({ "fsa-rn": "1234", _id: "test:Id" });

    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: mockFindOne
        })
      })
    }));

    const result = await findRegistrationByFsaId("1234");

    expect(result).toEqual({ "fsa-rn": "1234", _id: "test:Id" });
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
