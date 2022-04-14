jest.mock("../../services/logging.service");
jest.mock("../../connectors/configDb/configDb.connector", () => ({
  getCouncilsForSupplier: jest.fn()
}));

const { validateOptions } = require("./collections.v3.service");
const {
  getCouncilsForSupplier
} = require("../../connectors/configDb/configDb.connector");

describe("registrations.v3.service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  let result;
  const validsubscriber = "cardiff";
  describe("Function: validateOptions", () => {
    describe("When given valid subscriber", () => {
      beforeEach(async () => {
        const options = {
          subscriber: validsubscriber
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid subscriber", () => {
      const invalidCouncils = [1233, [], {}, false, null, undefined];
      invalidCouncils.forEach(async (subscriber) => {
        result = await validateOptions({ subscriber });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid requestedCouncils", () => {
      beforeEach(async () => {
        const validCouncils = ["cardiff", "bath"];
        getCouncilsForSupplier.mockImplementation(() => validCouncils);
        const options = {
          subscriber: validsubscriber,
          requestedCouncils: validCouncils
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid requestedCouncils", () => {
      const invalidCouncils = [1233, "council", false, null, undefined];
      invalidCouncils.forEach(async (requestedCouncils) => {
        result = await validateOptions({
          subscriber: validsubscriber,
          requestedCouncils: requestedCouncils
        });
        expect(result).not.toBe(true);
      });
    });

    describe("When given unauthorized requestedCouncils", () => {
      beforeEach(async () => {
        getCouncilsForSupplier.mockImplementation(() => ["cardiff", "bath"]);
        const options = {
          subscriber: validsubscriber,
          requestedCouncils: ["west-dorset"]
        };
        result = await validateOptions(options);
      });

      it("should not return true", () => {
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid double_mode", () => {
      beforeEach(async () => {
        const options = {
          double_mode: "success"
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid double_mode", () => {
      const invalidDoubleModes = [
        1233,
        [],
        {},
        false,
        null,
        undefined,
        "thing"
      ];
      invalidDoubleModes.forEach(async (double_mode) => {
        result = await validateOptions({ double_mode });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid new", () => {
      beforeEach(async () => {
        const options = {
          new: "true"
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid new", () => {
      const invalidNew = [
        1233,
        [],
        {},
        false,
        null,
        undefined,
        "normal string"
      ];
      invalidNew.forEach(async (newOption) => {
        result = await validateOptions({ new: newOption });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid fields", () => {
      beforeEach(async () => {
        const options = {
          fields: ["establishment"]
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid fields", () => {
      const invalidFields = [
        1233,
        ["invalid"],
        {},
        false,
        null,
        undefined,
        "thing"
      ];
      invalidFields.forEach(async (fields) => {
        result = await validateOptions({ fields });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid collected", () => {
      beforeEach(async () => {
        const options = {
          collected: true
        };
        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given invalid collected", () => {
      const invalidCollected = [
        1233,
        ["invalid"],
        {},
        "false",
        null,
        undefined,
        "thing"
      ];
      invalidCollected.forEach(async (collected) => {
        result = await validateOptions({ collected });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid before", () => {
      const validBefore = [
        "2019-03-15T15:53:40Z",
        "2019-03-15",
        "2019-03-15T15:00:00.000",
        "2020-02-29T00:01:02.132Z",
        "2020-06-30 23:15:00"
      ];

      validBefore.forEach(async (before) => {
        result = await validateOptions({ before });
        expect(result).toBe(true);
      });
    });

    describe("When given invalid before", () => {
      const invalidBefore = [
        1233979468,
        ["invalid"],
        {},
        "false",
        null,
        undefined,
        "thing",
        "2019-02-29T00:01:02.132Z",
        "2020-02-30",
        "2020-06-30 00:61:00",
        "2020-06-30 7:1:8",
        "20-6-1"
      ];
      invalidBefore.forEach(async (before) => {
        result = await validateOptions({ before });
        expect(result).not.toBe(true);
      });
    });

    describe("When given valid after", () => {
      const validAfter = [
        "2019-03-15T15:53:40Z",
        "2019-03-15",
        "2019-03-15T15:00:00.000",
        "2020-02-29T00:01:02.132Z",
        "2020-06-30 23:15:00"
      ];

      validAfter.forEach(async (after) => {
        result = await validateOptions({ after });
        expect(result).toBe(true);
      });
    });

    describe("When given invalid after", () => {
      const invalidAfter = [
        1233979468,
        ["invalid"],
        {},
        "false",
        null,
        undefined,
        "thing",
        "2019-02-29T00:01:02.132Z",
        "2020-02-30",
        "2020-06-30 00:61:00",
        "2020-06-30 7:1:8",
        "20-6-1"
      ];
      invalidAfter.forEach(async (after) => {
        result = await validateOptions({ after });
        expect(result).not.toBe(true);
      });
    });

    describe("When given a valid range (no longer than 7 days)", () => {
      beforeEach(async () => {
        const options = {
          after: "2019-01-15T12:00:00",
          before: "2019-01-22T12:00:00"
        };

        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).toBe(true);
      });
    });

    describe("When given an invalid range (longer than 7 days)", () => {
      beforeEach(async () => {
        const options = {
          after: "2019-01-15T12:00:00",
          before: "2019-01-22T12:00:01"
        };

        result = await validateOptions(options);
      });

      it("should return true", () => {
        expect(result).not.toBe(true);
      });
    });
  });
});
