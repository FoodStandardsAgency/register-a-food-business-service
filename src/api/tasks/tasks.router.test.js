jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn()
  }))
}));
jest.mock("./notifications.controller");

const { taskRouter } = require("./tasks.router");
const {
  sendNotificationsForRegistrationAction,
  sendAllNotificationsForRegistrationsAction
} = require("./notifications.controller");

describe("/api/tasks route: ", () => {
  let router, handler;
  let req, res;

  describe("GET to /bulk/sendnotification", () => {
    beforeEach(() => {
      router = taskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[0][1];

      req = { query: {} };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendAllNotificationsForRegistrationsAction", () => {
      expect(sendAllNotificationsForRegistrationsAction).toHaveBeenLastCalledWith(
        req,
        res,
        false,
        500
      );
    });

    it("Should call sendAllNotificationsForRegistrationsAction with dryrun true", () => {
      router = taskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[0][1];

      req = { query: { dryrun: true, throttle: 3000 } };
      res = {
        send: jest.fn()
      };
      handler(req, res);

      expect(sendAllNotificationsForRegistrationsAction).toHaveBeenLastCalledWith(
        req,
        res,
        true,
        3000
      );
    });
  });

  describe("GET to /sendnotification", () => {
    let fsaId = "test";
    beforeEach(() => {
      router = taskRouter();
      sendNotificationsForRegistrationAction.mockImplementation(() => {});
      handler = router.get.mock.calls[1][1];
      req = { params: { fsaId } };
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendNotificationsForRegistrationAction", () => {
      expect(sendNotificationsForRegistrationAction).toHaveBeenLastCalledWith(fsaId, req, res);
    });
  });
});
