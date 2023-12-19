jest.mock("mongodb");

const mongodb = require("mongodb");
const { getCouncilsForSupplier, getAllLocalCouncilConfig } = require("./configDb.connector");
const { clearCosmosConnection } = require("../cosmos.client");
const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
const mockSupplierConfig = require("./mockSupplierConfig.json");

let result;

describe("Function: getAllLocalCouncilConfig", () => {
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getAllLocalCouncilConfig();
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("mongoConnectionError");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    beforeEach(() => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            find: () => ({ toArray: () => mockLocalCouncilConfig })
          })
        })
      }));
    });

    it("should return the data from the find() response", async () => {
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(mockLocalCouncilConfig);
    });
  });

  describe("given the request is run more than once during this process (populated cache)", () => {
    beforeEach(() => {
      mongodb.MongoClient.connect.mockClear();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            find: () => ({ toArray: () => mockLocalCouncilConfig })
          })
        }),
        topology: {
          isConnected: () => true
        }
      }));
    });

    it("returns the correct value", async () => {
      // clear the cache
      // closeCosmosConnection();

      // run one request
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(mockLocalCouncilConfig);

      // run a second request without clearing the cache
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(mockLocalCouncilConfig);
    });

    it("does not call the mongo connection function on the second function call", async () => {
      // clear the cache
      clearCosmosConnection();

      // run one request
      await getAllLocalCouncilConfig();
      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1);

      // run a second request without clearing the cache
      await getAllLocalCouncilConfig();
      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Function: getCouncilsForSupplier", () => {
  const testSupplier = "testSupplier";

  describe("given the request throws an error", () => {
    beforeEach(async () => {
      clearCosmosConnection();
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        await getCouncilsForSupplier(testSupplier);
      } catch (err) {
        result = err;
      }
    });

    describe("when the error shows that the connection has failed", () => {
      it("should throw mongoConnectionError error", () => {
        expect(result.name).toBe("mongoConnectionError");
        expect(result.message).toBe("example mongo error");
      });
    });
  });

  describe("given the request is successful", () => {
    beforeEach(() => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: () => mockSupplierConfig[0]
          })
        })
      }));
    });

    it("should return the data from the findOne() response", async () => {
      await expect(getCouncilsForSupplier(testSupplier)).resolves.toEqual(
        mockSupplierConfig[0].local_council_urls
      );
    });
  });
});
