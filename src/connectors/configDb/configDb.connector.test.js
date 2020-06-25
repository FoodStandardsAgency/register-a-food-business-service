jest.mock("mongodb");
jest.mock("./configDb.double");
jest.mock("../../services/statusEmitter.service");
jest.mock("../registrationDb/registrationDb");

const mongodb = require("mongodb");
const registrationDb = require("../registrationDb/registrationDb");
const {
  getAllLocalCouncilConfig,
  getConfigVersion,
  clearMongoConnection,
  addDeletedId
} = require("./configDb.connector");
const mockLocalCouncilConfig = require("./mockLocalCouncilConfig.json");
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
      process.env.DOUBLE_MODE = false;
      clearMongoConnection();
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
      process.env.DOUBLE_MODE = false;
      clearMongoConnection();
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

describe("given the request is successful", () => {
  beforeEach(() => {
    process.env.DOUBLE_MODE = false;
    registrationDb.getAllCouncils.mockImplementation(
      () => mockLocalCouncilConfig
    );
  });

  it("should return the data from the find() response", async () => {
    await expect(getAllLocalCouncilConfig()).resolves.toEqual(
      mockLocalCouncilConfig
    );
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
