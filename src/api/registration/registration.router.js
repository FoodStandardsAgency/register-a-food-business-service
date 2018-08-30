const { Router } = require("express");
const registrationController = require("./registration.controller");
const {
  createRegistrationAuth,
  viewDeleteRegistrationAuth
} = require("../../middleware/authHandler");

const registrationRouter = () => {
  const router = Router();

  router.post(
    "/createNewRegistration",
    createRegistrationAuth,
    async (req, res, next) => {
      try {
        const response = await registrationController.createNewRegistration(
          req.body.registration,
          req.body.local_council_url
        );
        res.send(response);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get("/:fsa_rn", viewDeleteRegistrationAuth, async (req, res) => {
    const response = await registrationController.getRegistration(
      req.params.fsa_rn
    );
    res.send(response);
  });

  router.delete("/:fsa_rn", viewDeleteRegistrationAuth, async (req, res) => {
    const response = await registrationController.deleteRegistration(
      req.params.fsa_rn
    );
    res.send(response);
  });

  return router;
};

module.exports = { registrationRouter };
