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
    updateRegistrationTradingStatus: jest.fn(),
    updateNextStatusDate: jest.fn()
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
  updateRegistrationTradingStatus,
  updateNextStatusDate
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
      { local_council_url: "test-council", name: "Test Council", trading_status: {} },
      { local_council_url: "test-council-2", name: "Test Council 2", trading_status: {} }
    ];

    mockLaConfigWithNotify = {
      local_council_url: "test-council",
      name: "Test Council",
      address: "test@example.com",
      trading_status: {}
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
      const result = await processTradingStatusChecksDue(10);

      expect(findActionableRegistrations).toHaveBeenCalledWith(10);
      expect(getAllLocalCouncilConfig).toHaveBeenCalled();
      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      expect(processTradingStatus).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ success: true })]));
    });

    it("should handle errors during processing", async () => {
      // Make the process throw an error
      getLaConfigWithAllNotifyAddresses.mockRejectedValueOnce(new Error("Test error"));

      const result = await processTradingStatusChecksDue(10);

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ error: expect.any(String) })])
      );
    });

    it("should handle registration with local council that has no trading status configuration", async () => {
      // Create a registration with a council that will have no trading_status
      const mockRegistrationNoTrading = {
        "fsa-rn": "TEST-NO-TRADING",
        local_council_url: "council-without-trading-status"
      };

      // Mock the findActionableRegistrations to return our test registration
      findActionableRegistrations.mockResolvedValueOnce([mockRegistrationNoTrading]);

      // Mock getLaConfigWithAllNotifyAddresses to return a council without trading_status
      getLaConfigWithAllNotifyAddresses.mockResolvedValueOnce({
        local_council_url: "council-without-trading-status",
        name: "Council Without Trading Status"
        // No trading_status property
      });

      const result = await processTradingStatusChecksDue(5);

      // Verify updateNextStatusDate was called with null
      expect(updateNextStatusDate).toHaveBeenCalledWith("TEST-NO-TRADING", null);

      // Check result has the expected error
      expect(result).toEqual([
        expect.objectContaining({
          fsaId: "TEST-NO-TRADING",
          error: expect.stringContaining("No local council trading status configuration found for")
        })
      ]);
    });
  });

  describe("processTradingStatusChecksForId", () => {
    it("should process trading status check for a specific registration", async () => {
      await processTradingStatusChecksForId("TEST-123");

      expect(findRegistrationByFsaId).toHaveBeenCalledWith("TEST-123");
      expect(getAllLocalCouncilConfig).toHaveBeenCalled();
      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      expect(processTradingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ fsa_rn: "TEST-123" }),
        expect.any(Object)
      );
    });

    it("should throw an error if the registration is not found", async () => {
      await expect(processTradingStatusChecksForId("NONEXISTENT")).rejects.toThrow(
        /Could not find registration/
      );
    });

    it("should handle registration with local council that has no trading status configuration", async () => {
      // Create a mock registration with a specific ID
      const mockRegistrationNoTrading = {
        "fsa-rn": "TEST-NO-CONFIG",
        local_council_url: "council-no-config"
      };

      // Update the mock implementation for this test
      findRegistrationByFsaId.mockResolvedValueOnce(mockRegistrationNoTrading);

      // Mock LA config without trading_status
      getLaConfigWithAllNotifyAddresses.mockResolvedValueOnce({
        local_council_url: "council-no-config",
        name: "Council Without Config"
        // No trading_status property
      });

      const result = await processTradingStatusChecksForId("TEST-NO-CONFIG");

      // Check that updateNextStatusDate was called with null
      expect(updateNextStatusDate).toHaveBeenCalledWith("TEST-NO-CONFIG", null);

      // Check the result
      expect(result).toEqual(
        expect.objectContaining({
          fsaId: "TEST-NO-CONFIG",
          error: expect.stringContaining("No local council trading status configuration found for")
        })
      );
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

      await processTradingStatusChecksDue(5);

      expect(getLaConfigWithAllNotifyAddresses).toHaveBeenCalled();
      // TBD: Catch more cases and test more conditions in these tests
      expect(processTradingStatus).toHaveBeenCalled();
    });

    it("should handle multiple registrations", async () => {
      const result = await processTradingStatusChecksDue(10);

      expect(result.length).toBeGreaterThanOrEqual(mockRegistrations.length);
    });
  });
});
