const express = require("express");
const winston = require("winston");
const { routers } = require("./api/routers");

const app = express();
const port = process.env.PORT || 4000;

app.use("/", routers());

app.listen(port, () => {
  winston.info(`App Started listening on port ${port}`);
});
