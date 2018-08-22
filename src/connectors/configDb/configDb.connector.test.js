const mongodb = require("mongodb");
const { getAllLocalCouncilConfig } = require("./configDb.connector");
const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
const { lcConfigCollectionDouble } = require("./configDb.double");

jest.mock("mongodb");
jest.mock("./configDb.double");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));

let result;

describe("Function: getLocalCouncilDetails", () => {
  describe("given the request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
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
      lcConfigCollectionDouble.find.mockImplementation(() => ({
        toArray: () => mockLocalCouncilConfig
      }));
    });

    it("should resolve with the data from the double's find() response", async () => {
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(
        mockLocalCouncilConfig
      );
    });
  });
});
