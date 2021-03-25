jest.mock("./status-db.double");

jest.mock("mongodb");

const {
  getStoredStatus,
  updateStoredStatus,
  getEmailDistribution
} = require("./status-db.connector");
const storedStatusMock = require("../../__mocks__/storedStatusMock.json");
const mongodb = require("mongodb");
const { statusCollectionDouble } = require("./status-db.double");
const { clearCosmosConnection } = require("../cosmos.client");
const testArray = ["test@test.com"];
const testEmailDistributionObject = {
  _id: "emailDistribution",
  emailAddresses: ["test@test.com"]
};
describe("Function: getStoredStatus", () => {
  let result;
  describe("When: connection to mongo is successful", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => storedStatusMock
          })
        })
      }));
      result = await getStoredStatus();
    });

    it("Should return an object", () => {
      expect(typeof result).toBe("object");
    });
  });

  describe("Given: the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getStoredStatus();
      } catch (err) {
        result = err;
      }
    });

    it("should throw mongoConnectionError error", () => {
      expect(result.name).toBe("mongoConnectionError");
      expect(result.message).toBe("example mongo error");
    });
  });

  describe("When: topology is invalid", () => {
    const closeConnection = jest.fn();
    let result1, result2;
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => storedStatusMock
          })
        }),
        topology: null,
        close: () => closeConnection()
      }));
      result1 = await getStoredStatus();
      result2 = await getStoredStatus();
    });

    it("Should close broken connection", () => {
      expect(closeConnection).toHaveBeenCalledTimes(1);
    });
    it("Should return identical, valid results both times", () => {
      expect(typeof result1).toBe("object");
      expect(typeof result2).toBe("object");
      expect(result1).toEqual(result2);
    });
  });

  describe("When: connection is lost", () => {
    const closeConnection = jest.fn();
    let result1, result2;
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => storedStatusMock
          })
        }),
        topology: {
          isConnected: () => false
        },
        close: () => closeConnection()
      }));
      result1 = await getStoredStatus();
      result2 = await getStoredStatus();
    });

    it("Should close broken connection", () => {
      expect(closeConnection).toHaveBeenCalledTimes(1);
    });
    it("Should return identical, valid results both times", () => {
      expect(typeof result1).toBe("object");
      expect(typeof result2).toBe("object");
      expect(result1).toEqual(result2);
    });
  });

  describe("when running in double mode", () => {
    beforeEach(() => {
      process.env.DOUBLE_MODE = true;
      statusCollectionDouble.findOne.mockImplementation(() => storedStatusMock);
    });

    it("should resolve with the data from the double's findOne() response", async () => {
      await expect(getStoredStatus()).resolves.toEqual(storedStatusMock);
    });
  });

  describe("When: two db calls are made", () => {
    const closeConnection = jest.fn();
    let result1, result2;
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => storedStatusMock
          })
        }),
        topology: {
          isConnected: () => true
        },
        close: () => closeConnection()
      }));
      result1 = await getStoredStatus();
      result2 = await getStoredStatus();
    });

    it("Should return identical, valid results both times", () => {
      expect(typeof result1).toBe("object");
      expect(typeof result2).toBe("object");
      expect(result1).toEqual(result2);
    });
    it("Should not close connection", () => {
      expect(closeConnection).toHaveBeenCalledTimes(0);
    });
  });
});

describe("Function: updateStoredStatus", () => {
  let result;
  beforeEach(async () => {
    clearCosmosConnection();
    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          findOne: () => storedStatusMock,
          updateOne: (id, set) => set.$set.submissionsSucceeded
        })
      })
    }));
    result = await updateStoredStatus("submissionsSucceeded", 3);
  });

  it("Should return the updated value", () => {
    expect(result).toBe(3);
  });

  describe("Given: the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await updateStoredStatus();
      } catch (err) {
        result = err;
      }
    });

    it("should throw mongoConnectionError error", () => {
      expect(result.name).toBe("mongoConnectionError");
      expect(result.message).toBe("example mongo error");
    });
  });
});

describe("Function: getEmailDistribution", () => {
  let result;
  describe("When: connection to mongo is successful", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => testEmailDistributionObject
          })
        })
      }));
      result = await getEmailDistribution();
    });

    it("Should return an array", () => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Given: the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getEmailDistribution();
      } catch (err) {
        result = err;
      }
    });

    it("should throw mongoConnectionError error", () => {
      expect(result.name).toBe("mongoConnectionError");
      expect(result.message).toBe("example mongo error");
    });
  });

  describe("when running in double mode", () => {
    beforeEach(() => {
      process.env.DOUBLE_MODE = true;
      statusCollectionDouble.findOne.mockImplementation(
        () => testEmailDistributionObject
      );
    });

    it("should resolve with the data from the double's find() response", async () => {
      await expect(getEmailDistribution()).resolves.toEqual(testArray);
    });
  });
});
