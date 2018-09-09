const { Router } = require("express");
const { logEmitter } = require("../../services/logging.service");
const { getStatus } = require("../../services/status.service");

const statusRouter = () => {
  const router = Router();

  router.get("/all", async (req, res) => {
    logEmitter.emit("functionCall", "Routes", "/api/status/all route");
    const status = await getStatus();
    logEmitter.emit("functionSuccess", "Routes", "/api/status/all route");
    res.send(JSON.stringify(status));
  });

  router.get("/healthcheck", (req, res) => {
    logEmitter.emit("functionCall", "Routes", "/api/status/healthcheck route");
    logEmitter.emit(
      "functionSuccess",
      "Routes",
      "/api/status/healthcheck route"
    );
    res.send("BACK END healthcheck PASSED");
  });

  router.get("/name/:statusName", async (req, res) => {
    logEmitter.emit(
      "functionCall",
      "Routes",
      "/api/status/name/:statusName route"
    );
    const statusName = req.params.statusName;
    const status = await getStatus(statusName);
    logEmitter.emit(
      "functionSuccess",
      "Routes",
      "/api/status/name/:statusName route"
    );
    res.send(JSON.stringify(status));
  });

  return router;
};

module.exports = { statusRouter };
