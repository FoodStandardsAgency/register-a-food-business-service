const EventEmitter = require("events");
const { logger } = require("./winston");

class LogEmitter extends EventEmitter {}

const DEBUG = "debug";
const WARN = "warning";
const ERROR = "error";
const INFO = "info";
const FUNCTION_CALL = "functionCall";
const FUNCTION_SUCCESS = "functionSuccess";
const FUNCTION_FAIL = "functionFail";
const DOUBLE_MODE = "doubleMode";

const logEmitter = new LogEmitter();

const logStuff = (message, method = "info") => {
  if (!logger) {
    //create a logger now... its probably a test - enable below if you want debug
    //console.log({message, data, method});
  } else {
    logger[method](message);
  }
};

logEmitter.on(FUNCTION_CALL, (module, functionName) => {
  let message = `${module}: ${functionName} called`;
  logStuff(message);
});

logEmitter.on(FUNCTION_SUCCESS, (module, functionName) => {
  let message = `${module}: ${functionName} successful`;
  logStuff(message);
});

logEmitter.on(FUNCTION_FAIL, (module, functionName, err) => {
  let message = `${module}: ${functionName} failed with: ${err.message}`;
  logStuff(message, "error");
});

logEmitter.on(DOUBLE_MODE, (module, functionName) => {
  let message = `${module}: ${functionName}: running in double mode`;
  logStuff(message);
});

logEmitter.on(INFO, (message) => {
  logStuff(message);
});

logEmitter.on(WARN, (message) => {
  logStuff(message, "warn");
});

logEmitter.on(DEBUG, (message) => {
  logStuff(message, "debug");
});

logEmitter.on(ERROR, (message) => {
  logStuff(message, "error");
});

module.exports = {
  logEmitter,
  FUNCTION_CALL,
  FUNCTION_FAIL,
  FUNCTION_SUCCESS,
  DOUBLE_MODE,
  INFO,
  ERROR,
  DEBUG,
  WARN
};
