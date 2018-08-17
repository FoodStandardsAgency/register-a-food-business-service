const express = require("express");
const winston = require("winston");
const bodyParser = require("body-parser");
const helmet = require("helmet")

const { routers } = require("./api/routers");

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(bodyParser.json());
app.use("/", routers());

app.listen(port, () => {
  winston.info(`App Started listening on port ${port}`);
});
