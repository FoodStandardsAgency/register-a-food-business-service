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

logEmitter.on("functionFail", (module, functionName, err) => {
  error(`${module}: ${functionName} failed with: ${err.message}`);
});

logEmitter.on("doubleMode", (module, functionName) => {
  info(`${module}: ${functionName}: running in double mode`);
});

module.exports = { logEmitter };
