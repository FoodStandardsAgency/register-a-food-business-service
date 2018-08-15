jest.mock("../../db/db", () => ({
  Activities: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Establishment: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Metadata: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Operator: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Premise: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Registration: {
    create: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
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
  createRegistration,
  getRegistrationById,
  getEstablishmentByRegId,
  getMetadataByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId
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
        try {
          await createActivities({}, "45");
        } catch (err) {
          result = err;
        }
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
        try {
          await createEstablishment({}, "45");
        } catch (err) {
          result = err;
        }
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
    describe("When Metadata.create fails", () => {
      beforeEach(async () => {
        Metadata.create.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await createMetadata({}, "45");
        } catch (err) {
          result = err;
        }
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
        try {
          await createOperator({}, "45");
        } catch (err) {
          result = err;
        }
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
        try {
          await createPremise({}, "45");
        } catch (err) {
          result = err;
        }
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
        try {
          await createRegistration({}, "45");
        } catch (err) {
          result = err;
        }
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

  describe("Function: getRegistrationById", () => {
    describe("When Registration.findOne fails", () => {
      beforeEach(async () => {
        Registration.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getRegistrationById("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Registration.findOne succeeds", () => {
      beforeEach(async () => {
        Registration.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getRegistrationById("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Registration.findOne).toBeCalledWith({
          where: { id: "45" }
        });
      });
    });
  });

  describe("Function: getEstablishmentByRegId", () => {
    describe("When Establishment.findOne fails", () => {
      beforeEach(async () => {
        Establishment.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getEstablishmentByRegId("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Establishment.findOne succeeds", () => {
      beforeEach(async () => {
        Establishment.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getEstablishmentByRegId("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Establishment.findOne).toBeCalledWith({
          where: { registrationId: "45" }
        });
      });
    });
  });

  describe("Function: getMetadataByRegId", () => {
    describe("When Metadata.findOne fails", () => {
      beforeEach(async () => {
        Metadata.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getMetadataByRegId("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Metadata.findOne succeeds", () => {
      beforeEach(async () => {
        Metadata.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getMetadataByRegId("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Metadata.findOne).toBeCalledWith({
          where: { registrationId: "45" }
        });
      });
    });
  });

  describe("Function: getOperatorByEstablishmentId", () => {
    describe("When Operator.findOne fails", () => {
      beforeEach(async () => {
        Operator.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getOperatorByEstablishmentId("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Operator.findOne succeeds", () => {
      beforeEach(async () => {
        Operator.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getOperatorByEstablishmentId("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Operator.findOne).toBeCalledWith({
          where: { establishmentId: "45" }
        });
      });
    });
  });

  describe("Function: getPremiseByEstablishmentId", () => {
    describe("When Operator.findOne fails", () => {
      beforeEach(async () => {
        Premise.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getPremiseByEstablishmentId("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Premise.findOne succeeds", () => {
      beforeEach(async () => {
        Premise.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getPremiseByEstablishmentId("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Premise.findOne).toBeCalledWith({
          where: { establishmentId: "45" }
        });
      });
    });
  });

  describe("Function: getActivitiesByEstablishmentId", () => {
    describe("When Activities.findOne fails", () => {
      beforeEach(async () => {
        Activities.findOne.mockImplementation(() => {
          throw new Error("Failed");
        });
        try {
          await getActivitiesByEstablishmentId("45");
        } catch (err) {
          result = err;
        }
      });

      it("Should return the error", () => {
        expect(result.message).toBe("Failed");
      });
    });

    describe("When Activities.findOne succeeds", () => {
      beforeEach(async () => {
        Activities.findOne.mockImplementation(() => {
          return "success";
        });
        result = await getActivitiesByEstablishmentId("45");
      });

      it("Should return the response", () => {
        expect(result).toBe("success");
      });

      it("Should call the findOne model with query", () => {
        expect(Activities.findOne).toBeCalledWith({
          where: { establishmentId: "45" }
        });
      });
    });
  });
});
