jest.mock("./status.service");
const { statusEmitter } = require("./statusEmitter.service");
const { setStatus, incrementStatusCount } = require("./status.service");

jest.unmock("./statusEmitter.service");

describe("statusEmitter", () => {
  describe("on incrementCount event", () => {
    it("should call incrementStatusCount", () => {
      statusEmitter.emit("incrementCount", "exampleCounterName");
      expect(incrementStatusCount).toHaveBeenLastCalledWith(
        "exampleCounterName"
      );
    });
  });

  describe("on setStatus event", () => {
    it("should call setStatus", () => {
      statusEmitter.emit("setStatus", "exampleStatusName", "new value");
      expect(setStatus).toHaveBeenLastCalledWith(
        "exampleStatusName",
        "new value"
      );
    });
  });
});
