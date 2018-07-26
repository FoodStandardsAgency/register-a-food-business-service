const { Router } = require("express");
const registrationController = require("./registration.controller");

const registrationRouter = () => {
  const router = Router();

  router.post("/createNewRegistration", async (req, res) => {
    const response = await registrationController.createNewRegistration(
      req.body.registration
    );
    res.send(response);
  });

  router.get("/:id", async (req, res) => {
    const response = await registrationController.getRegistration(
      req.params.id
    );
    res.send(response);
  });

  return router;
};

module.exports = { registrationRouter };
