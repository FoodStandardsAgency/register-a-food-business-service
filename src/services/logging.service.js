const EventEmitter = require("events");
const { info, error, debug } = require("winston");

class LogEmitter extends EventEmitter {}

const DEBUG = "debug";
const ERROR = "error";
const INFO = "info";
const FUNCTION_CALL = "functionCall";
const FUNCTION_SUCCESS = "functionSuccess";
const FUNCTION_FAIL = "functionFail";
const DOUBLE_MODE = "doubleMode";

const logEmitter = new LogEmitter();

logEmitter.on(FUNCTION_CALL, (module, functionName) => {
  info(`${module}: ${functionName} called`);
});

logEmitter.on(FUNCTION_SUCCESS, (module, functionName) => {
  info(`${module}: ${functionName} successful`);
});

logEmitter.on(FUNCTION_FAIL, (module, functionName, err) => {
  error(`${module}: ${functionName} failed with: ${err.message}`);
});

logEmitter.on(DOUBLE_MODE, (module, functionName) => {
  info(`${module}: ${functionName}: running in double mode`);
});

logEmitter.on(INFO, message => {
  info(message);
});

logEmitter.on(DEBUG, message => {
  debug(message);
});

logEmitter.on(ERROR, message => {
  error(message);
});

module.exports = {
  logEmitter,
  FUNCTION_CALL,
  FUNCTION_FAIL,
  FUNCTION_SUCCESS,
  DOUBLE_MODE,
  INFO,
  ERROR,
  DEBUG
};
