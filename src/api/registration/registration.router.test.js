jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn()
  }))
}));
jest.mock("./registration.controller", () => ({
  createNewRegistration: jest.fn()
}));
const { registrationRouter } = require("./registration.router");
describe("registration router", () => {
  let router, send, handler;
  beforeEach(() => {
    send = jest.fn();
    router = registrationRouter();
  });

  afterEach(() => jest.clearAllMocks());

  describe("Post to /createNewRegistration", () => {
    beforeEach(() => {
      handler = router.post.mock.calls[0][1];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler({ body: { registration: "reg" } }, { send });
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });
    });
  });
});
