const express = require("express");
const winston = require("winston");
const bodyParser = require("body-parser");

const { routers } = require("./api/routers");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use("/", routers());
app.use(errorHandler);

app.listen(port, () => {
  winston.info(`App Started listening on port ${port}`);
});
