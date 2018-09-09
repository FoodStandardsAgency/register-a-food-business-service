const { Router } = require("express");
const { registrationRouter } = require("./registration/registration.router");
const { statusRouter } = require("./status/status.router");

const routers = () => {
  const router = Router();

  router.use("/api/registration", registrationRouter());
  router.use("/api/status", statusRouter());

  return router;
};

module.exports = { routers };
