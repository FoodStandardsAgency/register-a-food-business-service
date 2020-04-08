const EventEmitter = require("events");
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
  ),
  defaultMeta: { service: 'rafbs' },
  transports: [
    new transports.Console({
      format: format.combine(
          format.colorize(),
          format.simple()
      )
    }),

    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
        format.colorize(),
        format.simple()
    )
  }));
}

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

logEmitter.on(FUNCTION_CALL, (module, functionName) => {
  logger.info(`${module}: ${functionName} called`);
});

logEmitter.on(FUNCTION_SUCCESS, (module, functionName) => {
  logger.info(`${module}: ${functionName} successful`);
});

logEmitter.on(FUNCTION_FAIL, (module, functionName, err) => {
  logger.error(`${module}: ${functionName} failed with: ${err.message}`);
});

logEmitter.on(DOUBLE_MODE, (module, functionName) => {
  logger.info(`${module}: ${functionName}: running in double mode`);
});

logEmitter.on(INFO, message => {
  logger.info(message);
});

logEmitter.on(WARN, message => {
  logger.warn(message);
});

logEmitter.on(DEBUG, message => {
  logger.debug(message);
});

logEmitter.on(ERROR, message => {
  logger.error(message);
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
