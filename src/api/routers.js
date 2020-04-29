const { Router } = require("express");
const { registrationRouter } = require("./registration/registration.router");
const { statusRouter } = require("./status/status.router");
const { TaskRouter } = require("./tasks/TaskRouter.router");

const routers = () => {
  const router = Router();

  router.use("/api/tasks", TaskRouter());
  router.use("/api/registration", registrationRouter());
  router.use("/api/status", statusRouter());

  return router;
};

module.exports = { routers };
