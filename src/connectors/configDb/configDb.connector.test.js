jest.mock("mongodb");
jest.mock("./configDb.double");
jest.mock("../../services/statusEmitter.service");

const mongodb = require("mongodb");
const {
  getCouncilsForSupplier,
  getAllLocalCouncilConfig,
  getConfigVersion
} = require("./configDb.connector");
const { clearCosmosConnection } = require("../cosmos.client");
const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
const { lcConfigCollectionDouble } = require("./configDb.double");
const mockSupplierConfig = require("./mockSupplierConfig.json");
const mockConfigVersion = {
  _id: "1.2.0",
  notify_template_keys: {
    fbo_submission_complete: "123",
    lc_new_registration: "456"
  },
  path: {
    "/index": {
      on: true,
      switches: {}
    }
  }
};

let result;

describe("Function: getConfigVersion", () => {
  describe("given the request is successful", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            findOne: jest.fn(() => mockConfigVersion)
          })
        })
      }));
      result = await getConfigVersion("1.2.0");
    });

    it("should return the configVersion data for this version", () => {
      expect(result).toEqual(mockConfigVersion);
    });
  });
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(() => {
        throw new Error("example mongo error");
      });

      try {
        result = await getConfigVersion("1.2.0");
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
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(
        mockLocalCouncilConfig
      );
    });
  });

  describe("when running in double mode", () => {
    beforeEach(() => {
      lcConfigCollectionDouble.find.mockImplementation(() => ({
        toArray: () => mockLocalCouncilConfig
      }));
    });

    it("should resolve with the data from the double's find() response", async () => {
      await expect(getAllLocalCouncilConfig("hi")).resolves.toEqual(
        mockLocalCouncilConfig
      );
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
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(
        mockLocalCouncilConfig
      );

      // run a second request without clearing the cache
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(
        mockLocalCouncilConfig
      );
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
