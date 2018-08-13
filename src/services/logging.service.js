const EventEmitter = require("events");
const { info, error } = require("winston");

class LogEmitter extends EventEmitter {}

const logEmitter = new LogEmitter();

logEmitter.on("functionCall", (module, functionName) => {
  info(`${module}: ${functionName} called`);
});

logEmitter.on("functionSuccess", (module, functionName) => {
  info(`${module}: ${functionName} successful`);
});

logEmitter.on("functionFail", (module, functionName) => {
  error(`${module}: ${functionName} failed`);
});

module.exports = { logEmitter };
