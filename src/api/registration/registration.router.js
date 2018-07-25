const { Router } = require("express");

const registrationRouter = () => {
  const router = Router();

  router.post("/createNewRegistration", (req, res) => {
    res.send("router working");
  });

  return router;
};

module.exports = { registrationRouter };
