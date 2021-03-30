jest.mock("express", () => ({
  Router: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn()
  }))
}));

jest.mock("./tasks/TaskRouter.router", () => ({
  TaskRouter: jest.fn()
}));

jest.mock("./submissions/submissions.router", () => ({
  submissionsRouter: jest.fn()
}));

jest.mock("./collections/collections.router", () => ({
  collectionsRouter: jest.fn()
}));

jest.mock("./collections-v2/collections.v2.router", () => ({
  collectionsV2Router: jest.fn()
}));

jest.mock("./status/status.router", () => ({
  statusRouter: jest.fn()
}));

jest.mock("swagger-ui-express", () => ({
  serve: jest.fn(),
  setup: jest.fn()
}));

const { routers } = require("./routers");

describe("Function: routers", () => {
  let result;
  beforeEach(() => {
    result = routers();
  });

  it("Should return router object", () => {
    expect(typeof result).toBe("object");
    expect(result.use).toBeDefined();
  });

  it("Should call router.use", () => {
    expect(result.use).toBeCalled();
    expect(result.use.mock.calls[0][0]).toBe("/api/tasks");
    expect(result.use.mock.calls[1][0]).toBe("/api/submissions");
    expect(result.use.mock.calls[2][0]).toBe("/api/collections");
    expect(result.use.mock.calls[3][0]).toBe("/api/v1/collections");
    expect(result.use.mock.calls[4][0]).toBe("/api/v2/collections");
    expect(result.use.mock.calls[5][0]).toBe("/api/status");
    expect(result.use.mock.calls[6][0]).toBe("/api-docs");
    expect(result.use.mock.calls[7][0]).toBe("/");

    expect(result.get.mock.calls[0][0]).toBe("/api-docs");
    expect(result.get.mock.calls[1][0]).toBe("/api-docs/v1");
    expect(result.get.mock.calls[2][0]).toBe("/api-docs/v2");
  });
});
