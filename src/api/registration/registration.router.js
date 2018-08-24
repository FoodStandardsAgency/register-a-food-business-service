const { Router } = require("express");
const registrationController = require("./registration.controller");

const registrationRouter = () => {
  const router = Router();

  router.post("/createNewRegistration", async (req, res, next) => {
    try {
      const response = await registrationController.createNewRegistration(
        req.body.registration,
        req.body.local_council_url
      );
      res.send(response);
    } catch (err) {
      next(err);
    }
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
