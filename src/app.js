const appInsights = require('applicationinsights');

if ('APPINSIGHTS_INSTRUMENTATIONKEY' in process.env) {
  console.log(`Setting up application insights modules`)
  appInsights.setup().start();
}

const express = require("express");
const { logger } = require("./services/winston");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { routers } = require("./api/routers");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 4000;

const limiter = rateLimit({
  max: process.env.RATE_LIMIT // limit each IP to x requests per minute
});

app.use(limiter);
app.use(helmet());
app.use(bodyParser.json());
app.use("/", routers());
app.use(errorHandler);
app.use(morgan("combined", {stream: logger.stream}))
app.listen(port, () => {
  logger.info(`App Started listening on port ${port}`);
});
