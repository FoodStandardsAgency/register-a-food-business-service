let { createLogger, transports } = require("winston");
const logger = createLogger({
  exitOnError: false // do not exit on handled exceptions
});

const {
  AzureApplicationInsightsLogger
} = require("winston-azure-application-insights");
const { ElasticsearchTransport } = require("winston-elasticsearch");

let env = process.env.NODE_ENV;
let logLevel = env === "production" ? "error" : "info";
logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : logLevel;

let options;

// transports
let transportConfig = [];
let azureKey =
  "APPINSIGHTS_INSTRUMENTATIONKEY" in process.env &&
  process.env["APPINSIGHTS_INSTRUMENTATIONKEY"]
    ? process.env.APPINSIGHTS_INSTRUMENTATIONKEY
    : null;

switch (env) {
  case "production":
    options = {
      console: {
        level: logLevel,
        handleExceptions: true,
        colorize: true
      },

      azureOpts: {
        level: logLevel,
        key: azureKey
      }
    };

    if (azureKey !== null) {
      transportConfig.push(
        new AzureApplicationInsightsLogger(options.azureOpts)
      );
    }

    break;
  case "test":
    options = {
      console: {
        level: logLevel,
        handleExceptions: true,
        json: true,
        colorize: true
      }
    };

    break;
  case "development":
  case "local":
  default:
    options = {
      console: {
        level: logLevel,
        handleExceptions: true,
        json: true,
        colorize: true
      },

      esTransportOpts: {
        clientOpts: {
          node: "http://elk:9200"
        },
        level: logLevel
      }
    };

    transportConfig.push(new ElasticsearchTransport(options.esTransportOpts));

    break;
}

logger.stream = {
  write: (message, context = {}) => {
    logger.info(message, context);
  }
};

transportConfig.push(new transports.Console(options.console));

//add the transports to the logger
transportConfig.forEach((item) => {
  logger.add(item);
});

module.exports = { logger };
