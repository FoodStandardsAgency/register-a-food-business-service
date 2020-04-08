const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { logEmitter, INFO } = require("./services/logging.service");

const { routers } = require("./api/routers");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 4000;

const limiter = rateLimit({
  max: process.env.RATE_LIMIT, // limit each IP to x requests per minute
});

app.use(limiter);
app.use(helmet());
app.use(bodyParser.json());
app.use("/", routers());
app.use(errorHandler);

app.listen(port, () => {
  logEmitter.emit(INFO, `App Started listening on port ${port}`);
});
