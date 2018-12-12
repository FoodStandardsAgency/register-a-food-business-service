const { Router } = require("express");
const { getStatus } = require("../../services/status.service");

const statusRouter = () => {
  const router = Router();

  router.get("/all", async (req, res) => {
    const status = await getStatus();
    res.send(JSON.stringify(status));
  });

  router.get("/healthcheck", (req, res) => {
    res.send("BACK END healthcheck PASSED");
  });

  router.get("/name/:statusName", async (req, res) => {
    const statusName = req.params.statusName;
    const status = await getStatus(statusName);
    res.send(JSON.stringify(status));
  });

  return router;
};

module.exports = { statusRouter };
