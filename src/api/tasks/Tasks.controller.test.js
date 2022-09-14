jest.mock("axios");
jest.mock("mongodb");

const axios = require("axios");
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
      axios.mockImplementation(() => ({
        status: 200,
        data: { "fsa-rn": "1234" }
      }));

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return an empty array", () => {
      expect(fsaRn).toEqual("1234");
    });
  });

  describe("Given RNG fail:", () => {
    beforeEach(async () => {
      axios.mockImplementation(() => ({
        status: 500,
        data: undefined
      }));

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return an empty array", () => {
      expect(fsaRn).toEqual(false);
    });
  });

  describe("Given throw Error:", () => {
    beforeEach(async () => {
      axios.mockImplementation(() => {
        throw new Error("error");
      });

      fsaRn = await tryResolveRegistrationNumber({
        "fsa-rn": "tmp_1234"
      });
    });

    it("should return an empty array", () => {
      expect(fsaRn).toEqual(false);
    });
  });
});
