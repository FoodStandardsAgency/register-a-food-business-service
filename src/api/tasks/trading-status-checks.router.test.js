jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn()
  }))
}));

// Mock the controller methods
jest.mock("./trading-status-checks.controller", () => ({
  processTradingStatusChecksDue: jest.fn(),
  processTradingStatusChecksForId: jest.fn(),
  processFboStoppedTrading: jest.fn(),
  processFboConfirmedTrading: jest.fn()
}));

const { fail } = require("../../utils/express/response");

const { tradingStatusRouter } = require("./trading-status-checks.router");
const {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId,
  processFboStoppedTrading,
  processFboConfirmedTrading
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
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("Should call processTradingStatusChecks", async () => {
      await handler(req, res);
      expect(processTradingStatusChecksDue).toHaveBeenLastCalledWith(50);
    });

    it("Should call processTradingStatusChecks with throttle set to 10", async () => {
      req = { query: { throttle: 10 } };
      await handler(req, res);
      expect(processTradingStatusChecksDue).toHaveBeenLastCalledWith(10);
    });
  });

  describe("POST /bulk/trading-status-checks error handling", () => {
    const errorMessage = "bulk error";

    beforeEach(() => {
      router = tradingStatusRouter();
      processTradingStatusChecksDue.mockImplementation(() => {
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
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("Should call processTradingStatusChecksForId", async () => {
      await handler(req, res);
      expect(processTradingStatusChecksForId).toHaveBeenLastCalledWith(fsaId);
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

  describe("POST to /stopped-trading/:fsaId", () => {
    const fsaId = "test";
    const id = "encryptedId";

    beforeEach(() => {
      router = tradingStatusRouter();
      processFboStoppedTrading.mockImplementation(() => {});
      handler = router.post.mock.calls[2][1];
      req = { params: { fsaId }, query: { id } };
      res = {
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("Should call processFboStoppedTrading", async () => {
      await handler(req, res);
      expect(processFboStoppedTrading).toHaveBeenLastCalledWith(fsaId, id);
    });
  });

  describe("POST /stopped-trading/:fsaId error handling", () => {
    const fsaId = "test";
    const errorMessage = "stopped trading error";

    beforeEach(() => {
      router = tradingStatusRouter();
      processFboStoppedTrading.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      handler = router.post.mock.calls[2][1];
      req = { params: { fsaId }, query: { id: "encrypted:Id" } };
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

  describe("POST to /confirmed-trading/:fsaId", () => {
    const fsaId = "test";
    const id = "encryptedId";

    beforeEach(() => {
      router = tradingStatusRouter();
      processFboConfirmedTrading.mockImplementation(() => {});
      handler = router.post.mock.calls[3][1];
      req = { params: { fsaId }, query: { id } };
      res = {
        status: jest.fn(() => res),
        send: jest.fn()
      };
    });

    it("Should call processFboConfirmedTrading", async () => {
      await handler(req, res);
      expect(processFboConfirmedTrading).toHaveBeenLastCalledWith(fsaId, id);
    });
  });

  describe("POST /confirmed-trading/:fsaId error handling", () => {
    const fsaId = "test";
    const errorMessage = "confirmed trading error";

    beforeEach(() => {
      router = tradingStatusRouter();
      processFboConfirmedTrading.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      handler = router.post.mock.calls[3][1];
      req = { params: { fsaId }, query: { token: "encryptedId" } };
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
