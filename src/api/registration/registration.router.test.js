jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn()
  }))
}));
jest.mock("./registration.controller", () => ({
  createNewRegistration: jest.fn(),
  getRegistration: jest.fn()
}));
const registrationController = require("./registration.controller");
const { registrationRouter } = require("./registration.router");
describe("registration router", () => {
  let router, send, handler, status;
  beforeEach(() => {
    send = jest.fn();
    status = jest.fn();
    router = registrationRouter();
  });

  afterEach(() => jest.clearAllMocks());

  describe("Post to /createNewRegistration", () => {
    beforeEach(() => {
      handler = router.post.mock.calls[0][1];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler({ body: { registration: "reg" } }, { send, status });
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });
    });

    describe("when an error is thrown", () => {
      beforeEach(async () => {
        registrationController.createNewRegistration.mockImplementation(() => {
          throw new Error("reg error");
        });
        status.mockImplementation(() => ({
          send: jest.fn()
        }));
        await handler({ body: { registration: "reg" } }, { send, status });
      });
      it("should call res.status", () => {
        expect(status).toBeCalledWith(500);
      });
    });
  });

  describe("Get to /:id", () => {
    beforeEach(() => {
      handler = router.get.mock.calls[0][1];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler({ params: { id: "1" } }, { send });
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });

      it("should call getRegistration", () => {
        expect(registrationController.getRegistration).toBeCalled();
      });
    });
  });
});
