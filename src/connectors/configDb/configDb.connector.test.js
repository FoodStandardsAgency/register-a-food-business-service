const mongodb = require("mongodb");
const { getAllLocalCouncilConfig } = require("./configDb.connector");
const { mongoClientDouble } = require("./configDb.double");

jest.mock("mongodb");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));

const testLocalCouncilConfig = [
  {
    _id: 6008,
    lcName: "Mid & East Antrim Borough Council",
    lcEmails: ["antrim1@email.com", "antrim2@email.com"],
    urlString: "mid-and-east-antrim"
  },
  {
    _id: 4221,
    lcName: "West Dorset District Council",
    lcEmails: ["westdorset@email.com"],
    urlString: "west-dorset",
    separateStandardsCouncil: 4226
  },
  {
    _id: 4226,
    lcName: "Dorset County Council",
    lcEmails: ["dorsetcounty@email.com"],
    urlString: "dorset"
  }
];

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
            find: () => ({ toArray: () => testLocalCouncilConfig })
          })
        })
      }));
    });

    it("should return the data from the find() response", async () => {
      await expect(getAllLocalCouncilConfig()).resolves.toEqual(
        testLocalCouncilConfig
      );
    });
  });

  // describe("when running in double mode", () => {
  //   beforeEach(() => {
  //     process.env.DOUBLE_MODE = true;
  //     mongodb.mockImplementation(() => ({
  //       MongoClient: {}
  //     }));
  //     mongoClientDouble.find.mockImplementation(async () => testLocalCouncilConfig);
  //   });

  //   it("should resolve with the data from the double's find() response", async () => {
  //     await expect(getAllLocalCouncilConfig()).resolves.toEqual(testLocalCouncilConfig);
  //   });
  // });
});
