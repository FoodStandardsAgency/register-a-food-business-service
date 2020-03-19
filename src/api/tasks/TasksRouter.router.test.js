jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }))
}));

jest.mock("./Tasks.controller", () => ({
  sendRegistrationToTascomiAction: jest.fn(),
  sendNotificationsForRegistrationAction: jest.fn(),
  saveRegistrationToTempStoreAction: jest.fn(),
  sendAllOutstandingRegistrationsToTascomiAction: jest.fn(),
  sendAllNotificationsForRegistrationsAction: jest.fn(),
  saveAllOutstandingRegistrationsToTempStoreAction: jest.fn()
}));
jest.mock("../../services/statusEmitter.service");

const { TaskRouter } = require("./TaskRouter.router");
const { TaskController } = require("./Tasks.controller");

const {
  sendRegistrationToTascomiAction,
  sendNotificationsForRegistrationAction,
  saveRegistrationToTempStoreAction,
  sendAllOutstandingRegistrationsToTascomiAction,
  sendAllNotificationsForRegistrationsAction,
  saveAllOutstandingRegistrationsToTempStoreAction
} = require("./Tasks.controller");

let router, send, handler;

describe("registration router", () => {

  beforeEach(() => {
    send = jest.fn();
    router = TaskRouter();
  });

  afterEach(() => jest.clearAllMocks());

  describe("Get to /bulk/createtascomiregistration", () => {
    beforeEach(() => {
      handler = router.get.mock.calls[0][2];
      sendAllOutstandingRegistrationsToTascomiAction.mockImplementation((req, res)=>{});
    });

    it("should call registerSubmissionWithTascomiAction", () => {
      expect(
        sendAllOutstandingRegistrationsToTascomiAction
      ).toBeCalled();
    });
  });

});
