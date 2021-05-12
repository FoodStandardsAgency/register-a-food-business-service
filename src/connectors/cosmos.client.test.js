jest.mock("mongodb");
jest.mock("./configDb/configDb.double");

const mongodb = require("mongodb");
const { establishConnectionToCosmos } = require("./cosmos.client");
const { cachedRegistrationsDouble } = require("./cacheDb/cacheDb.double");
const {
  lcConfigCollectionDouble,
  supplierCollectionDouble
} = require("./configDb/configDb.double");
const { statusCollectionDouble } = require("./status/status-db.double");

describe("Function: establishConnectionToCosmos", () => {
  let result;
  describe("When: connection to mongo is successful", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({ key: "value" })
        })
      }));
      result = await establishConnectionToCosmos("dbName", "collection");
    });

    it("Should return the collection", () => {
      expect(result).toStrictEqual({ key: "value" });
    });
  });
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await establishConnectionToCosmos("dbName", "collection");
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw an error", () => {
        expect(result.name).toBe("Error");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request returns null", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => null
        })
      }));

      result = await establishConnectionToCosmos("dbName", "collection");
    });

    it("should return null", () => {
      expect(result).toBe(null);
    });
  });

  describe("When: topology is invalid", () => {
    const closeConnection = jest.fn();
    let result1, result2;
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({ key: "value" })
        }),
        topology: null,
        close: () => closeConnection()
      }));
      result1 = await establishConnectionToCosmos("dbName", "collection");
      result2 = await establishConnectionToCosmos("dbName", "collection");
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
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({ key: "value" })
        }),
        topology: {
          isConnected: () => false
        },
        close: () => closeConnection()
      }));
      result1 = await establishConnectionToCosmos("dbName", "collection");
      result2 = await establishConnectionToCosmos("dbName", "collection");
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
    });

    it("should resolve with the correct double data for each db callled", async () => {
      await expect(
        establishConnectionToCosmos("registrations", "collection")
      ).resolves.toEqual(cachedRegistrationsDouble);
      await expect(
        establishConnectionToCosmos("config", "localAuthorities")
      ).resolves.toEqual(lcConfigCollectionDouble);
      await expect(
        establishConnectionToCosmos("config", "suppliers")
      ).resolves.toEqual(supplierCollectionDouble);
      await expect(
        establishConnectionToCosmos("config", "collection")
      ).resolves.toEqual({});
      await expect(
        establishConnectionToCosmos("status", "collection")
      ).resolves.toEqual(statusCollectionDouble);
      await expect(
        establishConnectionToCosmos("dbName", "collection")
      ).resolves.toEqual({});
    });
  });

  describe("When: two db calls are made", () => {
    const closeConnection = jest.fn();
    let result1, result2;
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({ key: "value" })
        }),
        topology: {
          isConnected: () => true
        },
        close: () => closeConnection()
      }));
      result1 = await establishConnectionToCosmos("dbName", "collection");
      result2 = await establishConnectionToCosmos("dbName", "collection");
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
