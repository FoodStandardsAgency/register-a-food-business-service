jest.mock("../../services/submissions.service");
jest.mock("mongodb");

const { getFsaRn } = require("../../services/submissions.service");
const mongodb = require("mongodb");
const { tryResolveRegistrationNumber } = require("./Tasks.controller");

let fsaRn;

describe("Function: tryResolveRegistrationNumber: ", () => {
  beforeEach(() => {
    mongodb.MongoClient.connect.mockImplementation(async () => ({
      db: () => ({
        collection: () => ({
          findOne: () => {},
          updateOne: () => {}
        })
      })
    }));
  });

  describe("Given RNG sucess:", () => {
    beforeEach(async () => {
      getFsaRn.mockImplementation(() => "1234");

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return a new fsa-rn", () => {
      expect(fsaRn).toEqual("1234");
    });
  });

  describe("Given RNG fail:", () => {
    beforeEach(async () => {
      getFsaRn.mockImplementation(() => false);

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return a false", () => {
      expect(fsaRn).toEqual(false);
    });
  });

  describe("Given throw Error:", () => {
    beforeEach(async () => {
      mongodb.MongoClient.connect.mockImplementation(async () => ({
        db: () => ({
          collection: () => ({
            findOne: () => {},
            updateOne: () => {
              throw new Error("error");
            }
          })
        })
      }));

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return a false", () => {
      expect(fsaRn).toEqual(false);
    });
  });
});
