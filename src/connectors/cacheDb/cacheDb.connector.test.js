const mongodb = require("mongodb");
const { cacheRegistration } = require("./cacheDb.connector");

jest.mock("mongodb");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));

describe("Connector: cacheDb", () => {
  let response;
  describe("given the request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            insertOne: () => ({ insertedId: "764" })
          })
        })
      }));
      response = await cacheRegistration({ reg: "data" });
    });

    it("should return the response from the insertOne()", async () => {
      expect(response.insertedId).toBe("764");
    });
  });

  describe("given the request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      mongodb.MongoClient.connect.mockImplementation(() => ({
        db: () => ({
          collection: () => ({
            insertOne: () => {
              throw new Error("Example mongo error");
            }
          })
        })
      }));
      try {
        await cacheRegistration({ reg: "data" });
      } catch (err) {
        response = err;
      }
    });

    it("should catch the error", async () => {
      expect(response.message).toBe("Example mongo error");
    });
  });

  describe("when running in double mode", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = "true";
      response = await cacheRegistration();
    });

    it("should resolve with the data from the double's insertOne()", async () => {
      expect(response.insertedId).toBe("13478de349");
    });
  });
});
