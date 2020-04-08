jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
}));
jest.mock("../../services/status.service");

const { statusRouter } = require("./status.router");
const { getStatus } = require("../../services/status.service");

const testStatusObject = { exampleStatus: "value", anotherExample: 1 };

describe("/api/status route: ", () => {
  let router, handler;
  beforeEach(() => {
    router = statusRouter();
  });

  describe("GET to /api/status/all", () => {
    let req, res;

    beforeEach(() => {
      getStatus.mockImplementation(() => testStatusObject);
      handler = router.get.mock.calls[0][1];
      req = {};
      res = {
        send: jest.fn(),
      };
      handler(req, res);
    });

    it("Should call res.send with a success message", () => {
      expect(res.send).toHaveBeenLastCalledWith(
        JSON.stringify(testStatusObject)
      );
    });
  });

  describe("GET to /api/status/healthcheck", () => {
    let req, res;

    beforeEach(() => {
      handler = router.get.mock.calls[1][1];
      req = {};
      res = {
        send: jest.fn(),
      };
      handler(req, res);
    });

    it("Should call res.send with a success message", () => {
      expect(res.send).toHaveBeenLastCalledWith("BACK END healthcheck PASSED");
    });
  });

  describe("GET to /api/status/name/:statusName", () => {
    let req, res;

    beforeEach(() => {
      getStatus.mockImplementation(() => testStatusObject.exampleStatus);
      handler = router.get.mock.calls[2][1];
      req = {
        params: {
          statusName: "exampleStatus",
        },
      };
      res = {
        send: jest.fn(),
      };
      handler(req, res);
    });

    it("Should call res.send with a success message", () => {
      expect(res.send).toHaveBeenLastCalledWith(
        JSON.stringify(testStatusObject.exampleStatus)
      );
    });
  });
});
