const { Router } = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerV1Document = require("../../openAPI.spec.json");
const swaggerV2Document = require("../../openAPI-v2.spec.json");
const swaggerV3Document = require("../../openAPI-v3.spec.json");
const { submissionsRouter } = require("./submissions/submissions.router");
const { collectionsRouter } = require("./collections/collections.router");
const { collectionsV2Router } = require("./collections-v2/collections.v2.router");
const { collectionsV3Router } = require("./collections-v3/collections.v3.router");
const { statusRouter } = require("./status/status.router");
const { TaskRouter } = require("./tasks/TaskRouter.router");

const routers = () => {
  const router = Router();

  router.use("/api/tasks", TaskRouter());
  router.use("/api/submissions", submissionsRouter());
  router.use("/api/collections", collectionsRouter());
  router.use("/api/v1/collections", collectionsRouter());
  router.use("/api/v2/collections", collectionsV2Router());
  router.use("/api/v3/collections", collectionsV3Router());
  router.use("/api/status", statusRouter());

  router.use("/api-docs", swaggerUi.serve);
  router.get("/api-docs", swaggerUi.setup(swaggerV3Document));
  router.get("/api-docs/v1", swaggerUi.setup(swaggerV1Document));
  router.get("/api-docs/v2", swaggerUi.setup(swaggerV2Document));
  router.get("/api-docs/v3", swaggerUi.setup(swaggerV3Document));

  router.use("/", (req, res) => {
    res.send(swaggerV3Document);
  });

  return router;
};

module.exports = { routers };
