jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn()
  }))
}));
jest.mock("./Tasks.controller");

const { TaskRouter } = require("./TaskRouter.router");
const {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
} = require("./Tasks.controller");

describe("/api/tasks route: ", () => {
  let router, handler;
  let req, res;

  describe("GET to /bulk/createtascomiregistration", () => {
    beforeEach(() => {
      router = TaskRouter();
      sendAllOutstandingRegistrationsToTascomiAction.mockImplementation(
        () => {}
      );
      handler = router.get.mock.calls[0][1];

      req = { query: {} };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendAllOutstandingRegistrationsToTascomiAction", () => {
      expect(
        sendAllOutstandingRegistrationsToTascomiAction
      ).toHaveBeenLastCalledWith(req, res, false, 500);
    });

    it("Should call sendAllOutstandingRegistrationsToTascomiAction with dryrun true", () => {
      router = TaskRouter();
      sendAllOutstandingRegistrationsToTascomiAction.mockImplementation(
        () => {}
      );
      handler = router.get.mock.calls[0][1];

      req = { query: { dryrun: true } };
      res = {
        send: jest.fn()
      };
      handler(req, res);
      expect(
        sendAllOutstandingRegistrationsToTascomiAction
      ).toHaveBeenLastCalledWith(req, res, true, 500);
    });
  });

  describe("GET to /bulk/sendnotification", () => {
    beforeEach(() => {
      router = TaskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[2][1];

      req = { query: {} };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendAllNotificationsForRegistrationsAction", () => {
      expect(
        sendAllNotificationsForRegistrationsAction
      ).toHaveBeenLastCalledWith(req, res, false, 500);
    });

    it("Should call sendAllNotificationsForRegistrationsAction with dryrun true", () => {
      router = TaskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[2][1];

      req = { query: { dryrun: true, throttle: 3000 } };
      res = {
        send: jest.fn()
      };
      handler(req, res);

      expect(
        sendAllNotificationsForRegistrationsAction
      ).toHaveBeenLastCalledWith(req, res, true, 3000);
    });
  });

  describe("GET to /createtascomiregistration", () => {
    let fsaId = "test";
    beforeEach(() => {
      router = TaskRouter();
      sendRegistrationToTascomiAction.mockImplementation(() => {});
      handler = router.get.mock.calls[1][1];
      req = { params: { fsaId } };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendRegistrationToTascomiAction", () => {
      expect(sendRegistrationToTascomiAction).toHaveBeenLastCalledWith(
        fsaId,
        req,
        res
      );
    });
  });

  describe("GET to /sendnotification", () => {
    let fsaId = "test";
    beforeEach(() => {
      router = TaskRouter();
      sendNotificationsForRegistrationAction.mockImplementation(() => {});
      handler = router.get.mock.calls[3][1];
      req = { params: { fsaId } };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendNotificationsForRegistrationAction", () => {
      expect(sendNotificationsForRegistrationAction).toHaveBeenLastCalledWith(
        fsaId,
        req,
        res
      );
    });
  });
});
