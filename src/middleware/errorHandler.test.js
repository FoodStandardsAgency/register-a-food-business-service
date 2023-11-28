jest.mock("../services/winston", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

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
        name: "optionsValidationError"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(400);
      expect(res.send.mock.calls[0][0].errorCode).toBe("3");
    });
    it("should handle not finding error in errorDetails", () => {
      const error = {
        name: "randomUnknownError"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
      expect(res.send.mock.calls[0][0].errorCode).toBe("Unknown");
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

  describe("When given a mongoConnectionError error", () => {
    it("should append developer mesage with raw error", () => {
      const error = {
        name: "mongoConnectionError",
        message: "raw error message"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "MongoDB (Azure CosmosDB) connection failed, check credentials provided to app and status of database. Raw error: raw error message"
      );
    });
  });

  describe("When given a fsaRnFetchError error", () => {
    it("should append developer mesage with raw error", () => {
      const error = {
        name: "fsaRnFetchError",
        message: "unable to verify the first certificate"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "Fetch to the FSA-RN generator service failed, check status of service and authentication. Raw error: unable to verify the first certificate"
      );
    });
  });

  describe("When given a localCouncilNotFound error", () => {
    it("should append developer mesage with the URL", () => {
      const error = {
        name: "localCouncilNotFound",
        message: "some-invalid-local-council"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(400);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "The local council has not matched any records in the config database. Raw error: some-invalid-local-council"
      );
    });
  });

  describe("When given a missingRequiredHeader error", () => {
    it("should append developer mesage with raw error", () => {
      const error = {
        name: "missingRequiredHeader",
        message: "missing registration-data-version header"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(400);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "Required header missing in request. Please add and re-try request. Raw error: missing registration-data-version header"
      );
    });
  });

  describe("When given a doubleFail error", () => {
    it("should append developer mesage with raw error", () => {
      const error = {
        name: "doubleFail",
        message: "Double Mode Failure"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(400);
      expect(res.send.mock.calls[0][0].developerMessage).toEqual(
        "Double Mode Error. Raw error: Double Mode Failure"
      );
    });
  });

  describe("When given an unknown error", () => {
    it("should return 500 error", () => {
      const error = {
        message: "Unknown error"
      };
      errorHandler(error, "request", res);
      expect(res.status).toBeCalledWith(500);
    });
  });
});
