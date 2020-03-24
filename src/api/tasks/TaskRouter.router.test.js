jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn()
  }))
}));
jest.mock("./Tasks.controller");

const { TaskRouter } = require("./TaskRouter.router");
const {
  // sendRegistrationToTascomiAction,
  // sendNotificationsForRegistrationAction,
  // saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction
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

      req = {query:{}};
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendAllOutstandingRegistrationsToTascomiAction", () => {

      expect(
        sendAllOutstandingRegistrationsToTascomiAction
      ).toHaveBeenLastCalledWith(req, res, false);
    });

    it("Should call sendAllOutstandingRegistrationsToTascomiAction with dryrun true", () => {
      router = TaskRouter();
      sendAllOutstandingRegistrationsToTascomiAction.mockImplementation(
          () => {}
      );
      handler = router.get.mock.calls[0][1];

      req = {query:{dryrun:true}};
      res = {
        send: jest.fn()
      };
      handler(req, res);
      expect(
          sendAllOutstandingRegistrationsToTascomiAction
      ).toHaveBeenLastCalledWith(req, res, true);
    });
  });

  describe("GET to /bulk/sendnotification", () => {
    beforeEach(() => {
      router = TaskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[2][1];

      req = {query:{}};
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call sendAllNotificationsForRegistrationsAction", () => {
      expect(
        sendAllNotificationsForRegistrationsAction
      ).toHaveBeenLastCalledWith(req, res, false);
    });

    it("Should call sendAllNotificationsForRegistrationsAction with dryrun true", () => {
      router = TaskRouter();
      sendAllNotificationsForRegistrationsAction.mockImplementation(() => {});
      handler = router.get.mock.calls[2][1];

      req = {query:{dryrun:true}};
      res = {
        send: jest.fn()
      };
      handler(req, res);

      expect(
          sendAllNotificationsForRegistrationsAction
      ).toHaveBeenLastCalledWith(req, res, true);
    });
  });

  describe("GET to /bulk/savetotempstore", () => {
    beforeEach(() => {
      router = TaskRouter();
      saveAllOutstandingRegistrationsToTempStoreAction.mockImplementation(
        () => {}
      );
      handler = router.get.mock.calls[5][1];

      req = {query:{}};
      res = {
        send: jest.fn()
      };
      handler(req, res);
    });

    it("Should call saveAllOutstandingRegistrationsToTempStoreAction", () => {
      expect(
        saveAllOutstandingRegistrationsToTempStoreAction
      ).toHaveBeenLastCalledWith(req, res, false);
    });

    it("Should call saveAllOutstandingRegistrationsToTempStoreAction with dryrun true", () => {
      router = TaskRouter();
      saveAllOutstandingRegistrationsToTempStoreAction.mockImplementation(
          () => {}
      );
      handler = router.get.mock.calls[5][1];

      req = {query:{dryrun:true}};
      res = {
        send: jest.fn()
      };
      handler(req, res);

      expect(
          saveAllOutstandingRegistrationsToTempStoreAction
      ).toHaveBeenLastCalledWith(req, res, true);
    });
  });
});
