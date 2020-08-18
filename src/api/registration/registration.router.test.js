jest.mock("express", () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }))
}));
jest.mock("./registration.controller", () => ({
  createNewRegistration: jest.fn((a, b, c, sendResponse) => {
    sendResponse();
  }),
  getRegistration: jest.fn(),
  deleteRegistration: jest.fn()
}));
jest.mock("../../services/statusEmitter.service");
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
      handler = router.post.mock.calls[0][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler(
          {
            body: {
              registration: "reg",
              local_council_url: "example-council-url"
            },
            headers: {
              "registration-data-version": "1.2.0"
            }
          },
          { send, status }
        );
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });
    });

    describe("when an error is thrown", () => {
      let next;
      let errorMessage = "reg error";
      beforeEach(async () => {
        registrationController.createNewRegistration.mockImplementation(() => {
          throw new Error(errorMessage);
        });
        status.mockImplementation(() => ({
          send: send
        }));
        next = jest.fn();
        await expect(
          handler(
            {
              body: {
                registration: "reg",
                local_council_url: "example-council-url"
              },
              headers: {
                "registration-data-version": "1.2.0"
              }
            },
            { send, status },
            next
          )
        ).rejects.toThrow(Error);
      });
      it("should call send with status and error", () => {
        expect(status).toBeCalledWith(406);
        expect(send).toBeCalledWith({ error: errorMessage });
      });
    });
  });

  describe("Get to /:fsa_rn", () => {
    beforeEach(() => {
      handler = router.get.mock.calls[0][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler({ params: { fsa_rn: "1" } }, { send });
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });

      it("should call getRegistration", () => {
        expect(registrationController.getRegistration).toBeCalled();
      });
    });
  });

  describe("Delete to /:fsa_rn", () => {
    beforeEach(() => {
      handler = router.delete.mock.calls[0][2];
    });

    describe("when making a valid request", () => {
      beforeEach(async () => {
        await handler({ params: { fsa_rn: "1" } }, { send });
      });

      it("should call res.send", () => {
        expect(send).toBeCalled();
      });

      it("should call getRegistration", () => {
        expect(registrationController.deleteRegistration).toBeCalled();
      });
    });
  });
});
