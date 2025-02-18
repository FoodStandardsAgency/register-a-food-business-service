const { Router } = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerV2Document = require("../../openAPI-v2.spec.json");
const swaggerV3Document = require("../../openAPI-v3.spec.json");
const swaggerV4Document = require("../../openAPI-v4.spec.json");
const swaggerV5Document = require("../../openAPI-v5.spec.json");
const { submissionsRouter } = require("./submissions/submissions.router");
const { collectionsV2Router } = require("./collections-v2/collections.v2.router");
const { collectionsV3Router } = require("./collections-v3/collections.v3.router");
const { collectionsV4Router } = require("./collections-v4/collections.v4.router");
const { collectionsV5Router } = require("./collections-v5/collections.v5.router");
const { TaskRouter } = require("./tasks/TaskRouter.router");

const routers = () => {
  const router = Router();

  router.use("/api/tasks", TaskRouter());
  router.use("/api/submissions", submissionsRouter());
  router.use("/api/v2/collections", collectionsV2Router());
  router.use("/api/v3/collections", collectionsV3Router());
  router.use("/api/v4/collections", collectionsV4Router());
  router.use("/api/v5/collections", collectionsV5Router());

  router.use("/api-docs", swaggerUi.serve);
  router.get("/api-docs", swaggerUi.setup(swaggerV5Document));
  router.get("/api-docs/v2", swaggerUi.setup(swaggerV2Document));
  router.get("/api-docs/v3", swaggerUi.setup(swaggerV3Document));
  router.get("/api-docs/v4", swaggerUi.setup(swaggerV4Document));
  router.get("/api-docs/v5", swaggerUi.setup(swaggerV5Document));

  router.use("/", (req, res) => {
    res.send(swaggerV5Document);
  });

  return router;
};

module.exports = { routers };
