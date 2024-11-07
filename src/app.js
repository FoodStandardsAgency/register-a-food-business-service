const cls = require("cls-hooked");
const appInsights = require("applicationinsights");

require("dotenv").config();
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  console.log(`Setting up application insights modules`);
  // applicationinsights sdk v3 not support setting cloud role name, so we setting directly to the open telemetry env variable
  process.env["OTEL_SERVICE_NAME"] = process.env.CLOUD_ROLE;
  appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING);
  appInsights.start();
}

const { logger } = require("./services/winston");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { routers } = require("./api/routers");
const { errorHandler } = require("./middleware/errorHandler");

const clsNamespace = cls.createNamespace("application");
const { v4: uuidv4 } = require("uuid");
const clsMiddleware = (req, res, next) => {
  // req and res are event emitters. We want to access CLS context inside of their event callbacks
  clsNamespace.bindEmitter(req);
  clsNamespace.bindEmitter(res);

  clsNamespace.run(() => {
    clsNamespace.set("requestId", uuidv4());
    clsNamespace.set("request", req);
    next();
  });
};

const app = express();
const port = process.env.PORT || 4000;

const limiter = rateLimit({
  max: process.env.RATE_LIMIT // limit each IP to x requests per minute
});

app.use(clsMiddleware);
app.use(limiter);
app.use(helmet());
app.use(bodyParser.json());
app.use("/", routers());
app.use(errorHandler);
app.use(morgan("combined", { stream: logger.stream }));
app.listen(port, () => {
  logger.info(`App Started listening on port ${port}`);
});
