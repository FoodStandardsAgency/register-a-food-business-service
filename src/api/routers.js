const { Router } = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerV1Document = require("../../openAPI.spec.json");
const swaggerV2Document = require("../../openAPI-v2.spec.json");
const { registrationRouter } = require("./submissions/submissions.router");
const { collectionsRouter } = require("./collections/collections.router");
const {
  collectionsV2Router
} = require("./collections-v2/collections.v2.router");
const { statusRouter } = require("./status/status.router");
const { TaskRouter } = require("./tasks/TaskRouter.router");

const routers = () => {
  const router = Router();

  router.use("/api/tasks", TaskRouter());
  router.use("/api/submissions", registrationRouter());
  router.use("/api/collections", collectionsRouter());
  router.use("/api/v1/collections", collectionsRouter());
  router.use("/api/v2/collections", collectionsV2Router());
  router.use("/api/status", statusRouter());

  router.use("/api-docs", swaggerUi.serve);
  router.get("/api-docs", swaggerUi.setup(swaggerV2Document));
  router.get("/api-docs/v1", swaggerUi.setup(swaggerV1Document));
  router.get("/api-docs/v2", swaggerUi.setup(swaggerV2Document));

  router.use("/", (req, res) => {
    res.send(swaggerV2Document);
  });

  return router;
};

module.exports = { routers };
