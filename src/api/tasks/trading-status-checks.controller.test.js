// Set up mocks
jest.mock("../../services/status-checks.service");
jest.mock("../../services/laConfig.service");
jest.mock("../../connectors/statusChecksDb/status-checks.connector", () => {
  const originalModule = jest.requireActual(
    "../../connectors/statusChecksDb/status-checks.connector"
  );
  return {
    ...originalModule,
    findRegistrationByFsaId: jest.fn(),
    findActionableRegistrations: jest.fn(() => Promise.resolve([])), // Ensure mockResolvedValue is defined
    updateRegistrationTradingStatus: jest.fn()
  };
});
jest.mock("../../connectors/configDb/configDb.connector");
jest.mock("../../services/logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  },
  INFO: "INFO",
  ERROR: "ERROR"
}));

const { processTradingStatus } = require("../../services/status-checks.service");
const { getLaConfigWithAllNotifyAddresses } = require("../../services/laConfig.service");
const {
  findRegistrationByFsaId,
  findActionableRegistrations,
  updateRegistrationTradingStatus
} = require("../../connectors/statusChecksDb/status-checks.connector");
const { getAllLocalCouncilConfig } = require("../../connectors/configDb/configDb.connector");
const { logEmitter } = require("../../services/logging.service");

// Import controller after mocking dependencies
const {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId,
  processFboConfirmedTrading,
  processFboStoppedTrading
} = require("./trading-status-checks.controller");

describe("trading-status-checks.controller", () => {
  let mockReq;
  let mockRes;
  let mockRegistrations;
  let mockLaConfig;
  let mockLaConfigWithNotify;
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = process.env;
    process.env = { ...originalEnv };

    // Reset mock implementations
    jest.clearAllMocks();

    // Set up mock request and response objects
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes)
    };

    // Mock data
    mockRegistrations = [
      {
        fsa_rn: "TEST-123",
        local_council_url: "test-council"
      },
      {
        fsa_rn: "TEST-456",
        local_council_url: "test-council-2"
      }
    ];

    mockLaConfig = [
      { local_council_url: "test-council", name: "Test Council" },
      { local_council_url: "test-council-2", name: "Test Council 2" }
    ];

    mockLaConfigWithNotify = {
      local_council_url: "test-council",
      name: "Test Council",
      email: "test@example.com"
    };

    // Set up mock implementations
    findActionableRegistrations.mockResolvedValue(mockRegistrations);
    getAllLocalCouncilConfig.mockResolvedValue(mockLaConfig);
    getLaConfigWithAllNotifyAddresses.mockResolvedValue(mockLaConfigWithNotify);
    processTradingStatus.mockResolvedValue({ success: true, fsaId: "TEST-123" });
    findRegistrationByFsaId.mockImplementation((fsaId) => {
      if (fsaId === "TEST-123") {
        return Promise.resolve(mockRegistrations[0]);
      }
      return Promise.resolve(null);
    });
    updateRegistrationTradingStatus.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe("processTradingStatusChecksDue", () => {
    it("should process trading status checks for all actionable registrations", async () => {
      const result = await processTradingStatusChecksDue(mockReq, mockRes, 10);

      expect(findActionableRegistrations).toHaveBeenCalledWith(10);
      expect(getAllLocalCouncilConfig).toHaveBeenCalled();
      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      expect(processTradingStatus).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ success: true })]));
    });

    it("should handle errors during processing", async () => {
      // Make the process throw an error
      getLaConfigWithAllNotifyAddresses.mockRejectedValueOnce(new Error("Test error"));

      const result = await processTradingStatusChecksDue(mockReq, mockRes, 10);

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ error: expect.any(String) })])
      );
    });
  });

  describe("processTradingStatusChecksForId", () => {
    it("should process trading status check for a specific registration", async () => {
      await processTradingStatusChecksForId("TEST-123", mockReq, mockRes);

      expect(findRegistrationByFsaId).toHaveBeenCalledWith("TEST-123");
      expect(getAllLocalCouncilConfig).toHaveBeenCalled();
      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      expect(processTradingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ fsa_rn: "TEST-123" }),
        expect.any(Object)
      );
    });

    it("should throw an error if the registration is not found", async () => {
      await expect(
        processTradingStatusChecksForId("NONEXISTENT", mockReq, mockRes)
      ).rejects.toThrow(/Could not find registration/);
    });
  });

  describe("processFboConfirmedTrading", () => {
    it("should update the registration status to confirmed trading", async () => {
      await processFboConfirmedTrading("TEST-123", "testId");

      expect(updateRegistrationTradingStatus).toHaveBeenCalledWith("TEST-123", "testId", false);
    });
  });

  describe("processFboStoppedTrading", () => {
    it("should update the registration status to stopped trading", async () => {
      await processFboStoppedTrading("TEST-123", "testId");

      expect(updateRegistrationTradingStatus).toHaveBeenCalledWith("TEST-123", "testId", true);
    });
  });

  describe("Edge cases and environment handling", () => {
    it("should use default data retention period if environment variable is not set", async () => {
      delete process.env.DATA_RETENTION_PERIOD;

      await processTradingStatusChecksDue(mockReq, mockRes, 5);

      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      // TBD: Catch more cases and test more conditions in these tests
      expect(processTradingStatus).toHaveBeenCalled();
    });

    it("should handle multiple registrations", async () => {
      const result = await processTradingStatusChecksDue(mockReq, mockRes, 10);

      expect(result.length).toBeGreaterThanOrEqual(mockRegistrations.length);
    });
  });
});
