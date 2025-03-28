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

  describe("Post to /v3/createNewDirectRegistration", () => {
    beforeEach(() => {
      handler = router.post.mock.calls[2][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler(
          {
            body: {
              registration: "reg"
            },
            headers: {
              "registration-data-version": "3.0"
            },
            params: {
              subscriber: "cardiff"
            },
            query: {}
          },
          { send, status }
        );
      });

      it("should call createNewRegistration", () => {
        expect(submissionsController.createNewDirectRegistration).toBeCalled();
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });
    });

    describe("when an error is thrown", () => {
      let next;
      beforeEach(async () => {
        submissionsController.createNewDirectRegistration.mockImplementation(() => {
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
            },
            params: {
              subscriber: "cardiff"
            },
            query: {}
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
