jest.mock("../../db/db", () => ({
  Activities: {
    create: jest.fn()
  },
  Establishment: {
    create: jest.fn()
  },
  Metadata: {
    create: jest.fn()
  },
  Operator: {
    create: jest.fn()
  },
  Premise: {
    create: jest.fn()
  },
  Registration: {
    create: jest.fn()
  }
}));

const {
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration
} = require("../../db/db");

const {
  createActivities,
  createEstablishment,
  createMetadata,
  createOperator,
  createPremise,
  createRegistration
} = require("./registrationDb");

describe("RegistrationDb connector", () => {
  let result;
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Function: createActivities", () => {
    describe("When Activities.create fails", () => {
      beforeEach(async () => {
        Activities.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createActivities({}, "45");
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Activities.create succeeds", () => {
      beforeEach(async () => {
        Activities.create.mockImplementation(() => {
          return "success";
        });
        result = await createActivities({ some: "data" }, "45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with combined data", () => {
        expect(Activities.create).toBeCalledWith({
          establishmentId: "45",
          some: "data"
        });
      });
    });
  });

  describe("Function: createEstablishment", () => {
    describe("When Establishment.create fails", () => {
      beforeEach(async () => {
        Establishment.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createEstablishment({}, "45");
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Establishment.create succeeds", () => {
      beforeEach(async () => {
        Establishment.create.mockImplementation(() => {
          return "success";
        });
        result = await createEstablishment({ some: "data" }, "45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with combined data", () => {
        expect(Establishment.create).toBeCalledWith({
          registrationId: "45",
          some: "data"
        });
      });
    });
  });

  describe("Function: createMetadata", () => {
    describe("When Establishment.create fails", () => {
      beforeEach(async () => {
        Establishment.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createEstablishment({}, "45");
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Metadata.create succeeds", () => {
      beforeEach(async () => {
        Metadata.create.mockImplementation(() => {
          return "success";
        });
        result = await createMetadata({ some: "data" }, "45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with combined data", () => {
        expect(Metadata.create).toBeCalledWith({
          registrationId: "45",
          some: "data"
        });
      });
    });
  });

  describe("Function: createOperator", () => {
    describe("When Operator.create fails", () => {
      beforeEach(async () => {
        Operator.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createOperator({}, "45");
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Operator.create succeeds", () => {
      beforeEach(async () => {
        Operator.create.mockImplementation(() => {
          return "success";
        });
        result = await createOperator({ some: "data" }, "45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with combined data", () => {
        expect(Operator.create).toBeCalledWith({
          establishmentId: "45",
          some: "data"
        });
      });
    });
  });

  describe("Function: createPremise", () => {
    describe("When Premise.create fails", () => {
      beforeEach(async () => {
        Premise.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createPremise({}, "45");
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Premise.create succeeds", () => {
      beforeEach(async () => {
        Premise.create.mockImplementation(() => {
          return "success";
        });
        result = await createPremise({ some: "data" }, "45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with combined data", () => {
        expect(Premise.create).toBeCalledWith({
          establishmentId: "45",
          some: "data"
        });
      });
    });
  });
  describe("Function: createRegistration", () => {
    describe("When Registration.create fails", () => {
      beforeEach(async () => {
        Registration.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        result = await createRegistration({});
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Premise.create succeeds", () => {
      beforeEach(async () => {
        Registration.create.mockImplementation(() => {
          return "success";
        });
        result = await createRegistration({ some: "data" });
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the create model with registration data", () => {
        expect(Registration.create).toBeCalledWith({
          some: "data"
        });
      });
    });
  });
});
