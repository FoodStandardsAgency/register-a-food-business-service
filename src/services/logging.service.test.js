const cls = require("cls-hooked");
jest.mock("./winston", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

const { logger } = require("./winston");
const packageJson = require("../../package.json");

const {
  logEmitter,
  FUNCTION_CALL,
  FUNCTION_CALL_WITH,
  FUNCTION_SUCCESS,
  FUNCTION_SUCCESS_WITH,
  FUNCTION_FAIL,
  INFO,
  ERROR,
  DEBUG,
  WARN,
  ERROR_WITH
} = require("./logging.service");

const noSession = {
  context: {
    application_name: packageJson.name,
    request_id: null,
    session_id: null
  }
};

describe("logEmitter", () => {
  let clsNamespace;

  beforeEach(async () => {
    clsNamespace = cls.createNamespace("rafbfe");
  });
  afterEach(async () => {
    cls.reset();
  });

  describe("on functionCall event", () => {
    it("should call winston info with called", async () => {
      const message = FUNCTION_CALL;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const expected = `${moduleMessage}: ${funcMessage} called`;
      logger.info.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, moduleMessage, funcMessage);

      await expect(logger.info).toHaveBeenCalledWith(expected, noSession);
    });
  });

  //broken seems to not call the right log message
  describe("on functionCallWith event", () => {
    it("should call winston info with called with", async () => {
      const message = FUNCTION_CALL_WITH;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const someData = { data: "data" };
      const expected = `${moduleMessage}: ${funcMessage} called with: ${someData}`;

      logger.info.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, moduleMessage, funcMessage, someData);

      await expect(logger.info).toHaveBeenCalledWith(expected, noSession);
    });
  });

  describe("on functionSuccess event", () => {
    it("should call winston info", async () => {
      const message = FUNCTION_SUCCESS;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const expected = `${moduleMessage}: ${funcMessage} successful`;
      logger.info.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, moduleMessage, funcMessage);

      await expect(logger.info).toHaveBeenCalledWith(expected, noSession);
    });
  });

  describe("on functionSuccessWith event", () => {
    it("should call winston info with called with success", async () => {
      const message = FUNCTION_SUCCESS_WITH;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const someData = { data: "data" };
      const expected = `${moduleMessage}: ${funcMessage} called with: ${someData}`;
      logger.info.mockImplementation(() => {
        //Mock
      });
      await logEmitter.emit(message, moduleMessage, funcMessage, someData);

      await expect(logger.info).toHaveBeenCalledWith(expected, noSession);
    });
  });

  describe("on functionFail event", () => {
    it("should call winston info with failed with", async () => {
      const message = FUNCTION_FAIL;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const err = new Error("test");
      const expected = `${moduleMessage}: ${funcMessage} failed with: ${err.message}`;
      logger.error.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, moduleMessage, funcMessage, err);

      await expect(logger.error).toHaveBeenCalledWith(expected, noSession);
    });
  });

  describe("on errorWith event", () => {
    it("should call winston info with error with", async () => {
      const message = ERROR_WITH;
      const moduleMessage = "someModule";
      const funcMessage = "someFunction";
      const someData = { data: "data" };
      const expected1 = `${moduleMessage}: ${funcMessage} error with: ${JSON.stringify(someData)}`;

      logger.info.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, moduleMessage, funcMessage, someData);

      await expect(logger.info).toHaveBeenCalledWith(expected1, noSession);
    });
  });

  describe("simple logging", () => {
    it("should call winston info", async () => {
      const message = INFO;
      const expected = "someModule";
      logger.info.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, expected);

      await expect(logger.info).toHaveBeenCalledWith(expected, noSession);
    });

    it("should call winston error", async () => {
      const message = ERROR;
      const expected = "someModule";
      logger.error.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, expected);

      await expect(logger.error).toHaveBeenCalledWith(expected, noSession);
    });

    it("should call winston debug", async () => {
      const message = DEBUG;
      const expected = "someModule";
      logger.debug.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, expected);

      await expect(logger.debug).toHaveBeenCalledWith(expected, noSession);
    });

    it("should call winston warn", async () => {
      const message = WARN;
      const expected = "someModule";
      logger.warn.mockImplementation(() => {
        //Mock
      });

      await logEmitter.emit(message, expected);

      await expect(logger.warn).toHaveBeenCalledWith(expected, noSession);
    });
  });
});
