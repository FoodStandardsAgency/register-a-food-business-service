jest.mock("express", () => ({
  Router: jest.fn(() => ({
    use: jest.fn()
  }))
}));

jest.mock("./tasks/TaskRouter.router", () => ({
  TaskRouter: jest.fn()
}));

jest.mock("./registration/registration.router", () => ({
  registrationRouter: jest.fn()
}));

jest.mock("./status/status.router", () => ({
  statusRouter: jest.fn()
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
    expect(result.use.mock.calls[1][0]).toBe("/api/registration");
    expect(result.use.mock.calls[2][0]).toBe("/api/status");
  });
});
