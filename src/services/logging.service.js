const { logger } = require("./winston");
const EventEmitter = require("events");
const packageJson = require("../../package.json");
class LogEmitter extends EventEmitter {}

const DEBUG = "debug";
const WARN = "warning";
const ERROR = "error";
const INFO = "info";
const FUNCTION_CALL_WITH = "functionCallWith";
const FUNCTION_SUCCESS_WITH = "functionSuccessWith";
const ERROR_WITH = "errorWith";
const FUNCTION_CALL = "functionCall";
const FUNCTION_SUCCESS = "functionSuccess";
const FUNCTION_FAIL = "functionFail";

const logEmitter = new LogEmitter();

const getPresentContext = () => {
  const getNamespace = require("cls-hooked").getNamespace;

  const writer = getNamespace("application");

  const context = {
    context: {
      application_name: packageJson.name,
      request_id: null,
      session_id: null
    }
  };

  if (writer === undefined) {
    return context;
  }
  const reqId = writer.get("requestId");
  const req = writer.get("request");

  if (req) {
    context.context.request_id = reqId;
    context.context.session_id = req.headers["front-end-session-id"];
  }

  return context;
};
/* eslint-disable */
const logStuff = (message, data = {}, method = "info") => {
  if (!logger) {
    //create a logger now... its probably a test - enable below if you want debug
    //console.log({message, data, method});
  } else {
    logger[method](message, getPresentContext());
  }
};
/* eslint-enable */

logEmitter.on(FUNCTION_CALL_WITH, (module, functionName, data = {}) => {
  const message = `${module}: ${functionName} called with: ${data}`;
  logStuff(message, data);
});

logEmitter.on(FUNCTION_CALL, (module, functionName) => {
  const message = `${module}: ${functionName} called`;
  logStuff(message);
});

logEmitter.on(FUNCTION_SUCCESS, (module, functionName) => {
  const message = `${module}: ${functionName} successful`;
  logStuff(message);
});

logEmitter.on(FUNCTION_SUCCESS_WITH, (module, functionName, data = {}) => {
  const message = `${module}: ${functionName} successful with: ${data}`;
  logStuff(message);
});

logEmitter.on(FUNCTION_FAIL, (module, functionName, err = { message: null }) => {
  const message = `${module}: ${functionName} failed with: ${err.message || err}`;
  logStuff(message, {}, "error");
});

logEmitter.on(INFO, (message) => {
  logStuff(message);
});

logEmitter.on(WARN, (message) => {
  logStuff(message, {}, "warn");
});

logEmitter.on(DEBUG, (message) => {
  logStuff(message, {}, "debug");
});

logEmitter.on(ERROR, (message) => {
  logStuff(message, {}, "error");
});

logEmitter.on(ERROR_WITH, (module, functionName, data = {}) => {
  const message = `${module}: ${functionName} error with: ${JSON.stringify(data)}`;
  logStuff(message);
});

module.exports = {
  logEmitter,
  FUNCTION_CALL,
  FUNCTION_CALL_WITH,
  FUNCTION_FAIL,
  FUNCTION_SUCCESS,
  FUNCTION_SUCCESS_WITH,
  INFO,
  ERROR,
  ERROR_WITH,
  DEBUG,
  WARN
};
