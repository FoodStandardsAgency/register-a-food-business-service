const { Router } = require("express");
const { registrationRouter } = require("./registration/registration.router");

const routers = () => {
  const router = Router();

  router.use("/api/registration", registrationRouter());

  return router;
};

module.exports = { routers };
