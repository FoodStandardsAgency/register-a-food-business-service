jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }))
}));
jest.mock("./registration.controller", () => ({
  createNewRegistration: jest.fn(),
  createNewDirectRegistration: jest.fn(),
  getRegistration: jest.fn(),
  deleteRegistration: jest.fn()
}));
jest.mock("../../services/statusEmitter.service");
const registrationController = require("./registration.controller");
const { registrationRouter } = require("./registration.router");
const { doubleResponse } = require("./registration.double");
describe("registration router", () => {
  let router, send, handler, status, testRegistration;
  beforeEach(() => {
    send = jest.fn();
    status = jest.fn();
    router = registrationRouter();
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
        registrationController.createNewRegistration.mockImplementation(() => {
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

  describe("Post to /v2/createNewDirectRegistration", () => {
    beforeEach(() => {
      handler = router.post.mock.calls[1][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler(
          {
            body: {
              registration: "reg"
            },
            headers: {
              "registration-data-version": "1.6.0"
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
        expect(registrationController.createNewDirectRegistration).toBeCalled();
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });
    });

    describe("when an error is thrown", () => {
      let next;
      beforeEach(async () => {
        registrationController.createNewDirectRegistration.mockImplementation(
          () => {
            throw new Error("reg error");
          }
        );
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

    describe("when given double mode success header", () => {
      beforeEach(async () => {
        await handler(
          {
            body: {
              registration: "reg"
            },
            headers: {
              "double-mode": "success"
            },
            params: {
              subscriber: "cardiff"
            },
            query: {}
          },
          { send, status }
        );
      });

      it("should not call registrationController", () => {
        expect(
          registrationController.createNewDirectRegistration
        ).not.toHaveBeenCalled();
      });

      it("should call res.send", () => {
        expect(send).toHaveBeenCalledWith(doubleResponse);
      });
    });

    describe("when given double mode fail header", () => {
      let next;
      beforeEach(async () => {
        next = jest.fn();
        await handler(
          {
            body: {
              registration: "reg"
            },
            headers: {
              "double-mode": "fail"
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

      it("should not call registrationController", () => {
        expect(
          registrationController.createNewDirectRegistration
        ).not.toHaveBeenCalled();
      });

      it("should not call res.send", () => {
        expect(send).not.toHaveBeenCalled();
      });

      it("should call next with error", () => {
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
