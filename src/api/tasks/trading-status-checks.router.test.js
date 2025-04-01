jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn()
  }))
}));
jest.mock("./trading-status-checks.controller");
const { fail } = require("../../utils/express/response");

const { tradingStatusRouter } = require("./trading-status-checks.router");
const {
  processTradingStatusChecks,
  processTradingStatusChecksForId
} = require("./trading-status-checks.controller");

describe("/api/trading-status-checks route: ", () => {
  let router, handler;
  let req, res;

  describe("POST to /bulk/trading-status-checks", () => {
    beforeEach(() => {
      router = tradingStatusRouter();
      handler = router.post.mock.calls[0][1];

      req = { query: {} };
      res = {
        send: jest.fn()
      };
    });

    it("Should call processTradingStatusChecks", async () => {
      await handler(req, res);
      expect(processTradingStatusChecks).toHaveBeenLastCalledWith(req, res, 50);
    });

    it("Should call processTradingStatusChecks with throttle set to 10", async () => {
      req = { query: { throttle: 10 } };
      await handler(req, res);
      expect(processTradingStatusChecks).toHaveBeenLastCalledWith(req, res, 10);
    });
  });

  describe("POST /bulk/trading-status-checks error handling", () => {
    const errorMessage = "bulk error";

    beforeEach(() => {
      router = tradingStatusRouter();
      processTradingStatusChecks.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      handler = router.post.mock.calls[0][1];
      req = { query: { throttle: 20 } };
      res = {
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("should return error 500 response with a message on error", async () => {
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("POST to /trading-status-checks/:fsaId", () => {
    const fsaId = "test";

    beforeEach(() => {
      router = tradingStatusRouter();
      processTradingStatusChecksForId.mockImplementation(() => {});
      handler = router.post.mock.calls[1][1];
      req = { params: { fsaId } };
      res = {
        send: jest.fn()
      };
    });

    it("Should call processTradingStatusChecksForId", async () => {
      await handler(req, res);
      expect(processTradingStatusChecksForId).toHaveBeenLastCalledWith(fsaId, req, res);
    });
  });

  describe("POST /trading-status-checks/:fsaId error handling", () => {
    const fsaId = "test";
    const errorMessage = "single id error";

    beforeEach(() => {
      router = tradingStatusRouter();
      processTradingStatusChecksForId.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      handler = router.post.mock.calls[1][1];
      req = { params: { fsaId } };
      res = {
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("should return error 500 response with a message on error", async () => {
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
