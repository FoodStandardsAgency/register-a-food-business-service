jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }))
}));
jest.mock("./submissions.controller", () => ({
  createNewRegistration: jest.fn(),
  createNewDirectRegistration: jest.fn()
}));
jest.mock("../../services/statusEmitter.service");
const submissionsController = require("./submissions.controller");
const { submissionsRouter } = require("./submissions.router");
describe("submissions router", () => {
  let router, send, handler, status, testRegistration;
  beforeEach(() => {
    send = jest.fn();
    status = jest.fn();
    router = submissionsRouter();
    testRegistration = {
      registration: "reg",
      local_council_url: "example-council-url",
      submission_language: "en"
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe("Post to /createNewRegistration", () => {
    beforeEach(() => {
      handler = router.post.mock.calls[0][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler(
          {
            body: testRegistration,
            headers: {
              "registration-data-version": "1.2.0"
            }
          },
          { send, status }
        );
      });

      it("should return res.send", () => {
        expect(send).toBeCalled();
      });
    });

    describe("when an error is thrown", () => {
      let next;
      beforeEach(async () => {
        submissionsController.createNewRegistration.mockImplementation(() => {
          throw new Error("reg error");
        });
        status.mockImplementation(() => ({
          send: jest.fn()
        }));
        next = jest.fn();
        await handler(
          {
            body: testRegistration,
            headers: {
              "registration-data-version": "1.2.0"
            }
          },
          { send, status },
          next
        );
      });
      it("should call next with error", () => {
        expect(next).toBeCalledWith(new Error("reg error"));
      });
    });
  });
});
