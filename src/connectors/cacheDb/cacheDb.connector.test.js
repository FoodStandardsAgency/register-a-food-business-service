const mongodb = require("mongodb");
const {
  cacheRegistration,
  clearMongoConnection
} = require("./cacheDb.connector");

jest.mock("mongodb");
jest.mock("../../services/statusEmitter.service");

describe("Connector: cacheDb", () => {
  let response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the request is successful", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      clearMongoConnection();
      mongodb.MongoClient.connect.mockImplementation(async () => ({
        db: () => ({
          collection: () => ({
            insertOne: () => ({ insertedId: "764" })
          })
        })
      }));
      response = await cacheRegistration({ reg: "data" });
    });

    it("should return the response from the insertOne()", () => {
      expect(response.insertedId).toBe("764");
    });
  });

  describe("given the request throws an error", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      clearMongoConnection();
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
        response = await cacheRegistration({ reg: "data" });
      } catch (err) {
        response = err;
      }
    });

    it("should catch the error", () => {
      expect(response.message).toBe("Example mongo error");
    });
  });

  describe("given two requests without clearing the mongo connection", () => {
    beforeEach(async () => {
      process.env.DOUBLE_MODE = false;
      clearMongoConnection();
      mongodb.MongoClient.connect.mockImplementation(async () => ({
        db: () => ({
          collection: () => ({
            insertOne: () => ({ insertedId: "1000" })
          })
        })
      }));

      response = await cacheRegistration({ reg: "data" });

      mongodb.MongoClient.connect.mockImplementation(async () => ({
        db: () => ({
          collection: () => ({
            insertOne: () => ({ insertedId: "2000" })
          })
        })
      }));

      response = await cacheRegistration({ reg: "data" });
    });

    it("should have used the first mongo connnection both times", () => {
      expect(response.insertedId).toBe("1000");
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
