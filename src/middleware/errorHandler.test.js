const { errorHandler } = require("./errorHandler");

const res = {
  status: jest.fn(),
  send: jest.fn()
};

describe("Middleware: errorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("When given an error", () => {
    it("should find the error in errorDetails", () => {
      const error = {
        name: "tascomiAuth"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
      expect(res.send.mock.calls[0][0].errorCode).toBe("1");
    });
  });

  describe("When given a validationError", () => {
    it("should set userMessages to the validationErrors", () => {
      const error = {
        name: "validationError",
        validationErrors: [
          {
            property: "email",
            message: "invalid"
          }
        ]
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(400);
      expect(res.send.mock.calls[0][0].userMessages).toEqual([
        {
          property: "email",
          message: "invalid"
        }
      ]);
    });
  });

  describe("When given a notifyInvalidTemplate error", () => {
    it("should append developer mesage with raw error", () => {
      const error = {
        name: "notifyInvalidTemplate",
        message: "raw error message"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "Notify template ID is not valid, check credentials provided to app. Raw error: raw error message"
      );
    });
  });

  describe("When given an unknown error", () => {
    it("should return 500 error", () => {
      const error = {
        message: "Unkown error"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
    });
  });
});
