const mongodb = require("mongodb");
const {
  getAllLocalCouncilConfig,
  clearLcConfigCache,
  clearMongoConnection,
  addDeletedId
} = require("./configDb.connector");
const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
const { lcConfigCollectionDouble } = require("./configDb.double");

jest.mock("mongodb");
jest.mock("./configDb.double");

let result;

describe("Function: getLocalCouncilDetails", () => {
  describe("given the request has not yet been run during this process (empty cache)", () => {
    describe("given the request throws an error", () => {
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearLcConfigCache();
        clearMongoConnection();
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
        process.env.DOUBLE_MODE = false;
        clearLcConfigCache();
        clearMongoConnection();
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
        process.env.DOUBLE_MODE = true;
        clearLcConfigCache();
        clearMongoConnection();
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
  });

  describe("given the request is run more than once during this process (populated cache)", () => {
    beforeEach(() => {
      process.env.DOUBLE_MODE = false;
      clearLcConfigCache();
      clearMongoConnection();
      mongodb.MongoClient.connect.mockClear();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            find: () => ({ toArray: () => mockLocalCouncilConfig })
          })
        })
      }));
    });

    it("returns the correct value", async () => {
      // clear the cache
      clearLcConfigCache();
      clearMongoConnection();

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
      clearLcConfigCache();
      clearMongoConnection();

      // run one request
      await getAllLocalCouncilConfig();
      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1);

      // run a second request without clearing the cache
      await getAllLocalCouncilConfig();
      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("given two requests without clearing the mongo connection", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      jest.clearAllMocks();
      clearMongoConnection();
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            find: () => ({ toArray: () => mockLocalCouncilConfig })
          })
        })
      }));
    });

    it("should have called the connect function only once", async () => {
      clearLcConfigCache();
      response = await getAllLocalCouncilConfig();
      clearLcConfigCache();
      response = await getAllLocalCouncilConfig();

      expect(mongodb.MongoClient.connect).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Function: addDeletedId", () => {
  let response;

  beforeEach(async () => {
    process.env.DOUBLE_MODE = false;
    clearMongoConnection();
    mongodb.MongoClient.connect.mockImplementation(() => ({
      db: () => ({
        collection: () => ({
          insertOne: jest.fn(() => "inserted")
        })
      })
    }));

    response = await addDeletedId();
  });

  it("should return the response from the insertOne()", async () => {
    expect(response).toBe("inserted");
  });
});
