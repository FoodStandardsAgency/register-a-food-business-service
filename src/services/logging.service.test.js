jest.mock("./winston", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

const { logger } = require("./winston");

const {
  logEmitter,
  FUNCTION_CALL,
  FUNCTION_SUCCESS,
  FUNCTION_FAIL,
  DOUBLE_MODE,
  INFO,
  ERROR,
  DEBUG,
  WARN
} = require("./logging.service");

describe("logEmitter", () => {
  describe("on functionCall event", () => {
    it("should call winston info", async () => {
      let message = FUNCTION_CALL;
      let moduleMessage = "someModule";
      let funcMessage = "someFunction";
      let expected = `${moduleMessage}: ${funcMessage} called`;
      logger.info.mockImplementation(() => {});

      await logEmitter.emit(message, moduleMessage, funcMessage);

      await expect(logger.info).toBeCalledWith(expected);
    });
  });

  describe("on functionSuccess event", () => {
    it("should call winston info", async () => {
      let message = FUNCTION_SUCCESS;
      let moduleMessage = "someModule";
      let funcMessage = "someFunction";
      let expected = `${moduleMessage}: ${funcMessage} successful`;
      logger.info.mockImplementation(() => {});

      await logEmitter.emit(message, moduleMessage, funcMessage);

      await expect(logger.info).toBeCalledWith(expected);
    });
  });

  describe("on functionFail event", () => {
    it("should call winston info", async () => {
      let message = FUNCTION_FAIL;
      let moduleMessage = "someModule";
      let funcMessage = "someFunction";
      let err = new Error("test");
      let expected = `${moduleMessage}: ${funcMessage} failed with: ${err.message}`;
      logger.error.mockImplementation(() => {});

      await logEmitter.emit(message, moduleMessage, funcMessage, err);

      await expect(logger.error).toBeCalledWith(expected);
    });
  });

  describe("on doubleMode event", () => {
    it("should call winston info", async () => {
      let message = DOUBLE_MODE;
      let moduleMessage = "someModule";
      let funcMessage = "someFunction";
      let expected = `${moduleMessage}: ${funcMessage}: running in double mode`;
      logger.info.mockImplementation(() => {});

      await logEmitter.emit(message, moduleMessage, funcMessage);

      await expect(logger.info).toBeCalledWith(expected);
    });
  });

  describe("simple logging", () => {
    it("should call winston info", async () => {
      let message = INFO;
      let expected = "someModule";
      logger.info.mockImplementation(() => {});

      await logEmitter.emit(message, expected);

      await expect(logger.info).toBeCalledWith(expected);
    });

    it("should call winston error", async () => {
      let message = ERROR;
      let expected = "someModule";
      logger.error.mockImplementation(() => {});

      await logEmitter.emit(message, expected);

      await expect(logger.error).toBeCalledWith(expected);
    });

    it("should call winston debug", async () => {
      let message = DEBUG;
      let expected = "someModule";
      logger.debug.mockImplementation(() => {});

      await logEmitter.emit(message, expected);

      await expect(logger.debug).toBeCalledWith(expected);
    });

    it("should call winston warn", async () => {
      let message = WARN;
      let expected = "someModule";
      logger.warn.mockImplementation(() => {});

      await logEmitter.emit(message, expected);

      await expect(logger.warn).toBeCalledWith(expected);
    });
  });
});
