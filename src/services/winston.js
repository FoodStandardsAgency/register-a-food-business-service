let { createLogger, transports } = require("winston");
const logger = createLogger({
  exitOnError: false // do not exit on handled exceptions
});

const {
  AzureApplicationInsightsLogger
} = require("winston-azure-application-insights");
const { ElasticsearchTransport } = require("winston-elasticsearch");

let env = process.env.NODE_ENV;

let options;

// transports
let transportConfig;

switch (env) {
  case "production":
    options = {
      console: {
        level: "error",
        handleExceptions: true,
        colorize: true
      },
      esTransportOpts: {
        clientOpts: {
          node: "http://elk:9200"
        },
        level: "info"
      },

      azureOpts: {
        level: "error",
        key: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
      }
    };

    if (
      "APPINSIGHTS_INSTRUMENTATIONKEY" in process.env &&
      process.env["APPINSIGHTS_INSTRUMENTATIONKEY"] !== ""
    ) {
      console.log(`Starting azure logger`);
      // transportConfig = [new AzureApplicationInsightsLogger(options.azureOpts)];
      transportConfig = [new ElasticsearchTransport(options.esTransportOpts)];
    }

    break;
  case "test":
    options = {
      console: {
        level: "info",
        handleExceptions: true,
        json: true,
        colorize: true
      }
    };

    transportConfig = [];
    break;
  case "development":
  case "local":
  default:
    options = {
      console: {
        level: "info",
        handleExceptions: true,
        json: true,
        colorize: true
      },

      esTransportOpts: {
        clientOpts: {
          node: "http://elk:9200"
        },
        level: "info"
      },

      azureOpts: {
        level: "error",
        key: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
      }
    };

    transportConfig = [new ElasticsearchTransport(options.esTransportOpts)];

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
