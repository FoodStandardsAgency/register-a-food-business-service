"use strict";

jest.mock("./logging.service", () => ({
  logEmitter: {
    emit: jest.fn()
  }
}));

const { getLaConfigWithAllNotifyAddresses } = require("./laConfig.service");
const { logEmitter } = require("./logging.service");

describe("LA Config Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLaConfigWithAllNotifyAddresses", () => {
    let mockAllLaConfigData;

    beforeEach(() => {
      mockAllLaConfigData = [
        {
          _id: "council1",
          local_council_url: "council1-url",
          local_council_notify_emails: ["council1@example.com"]
        },
        {
          _id: "council2",
          local_council_url: "council2-url",
          local_council_notify_emails: ["council2@example.com"],
          separate_standards_council: "council3"
        },
        {
          _id: "council3",
          local_council_url: "council3-url",
          local_council_notify_emails: ["standards@example.com"]
        }
      ];
    });

    it("should return LA config with tradingStatusLaEmailAddresses when LA exists without separate standards", async () => {
      const result = await getLaConfigWithAllNotifyAddresses("council1-url", mockAllLaConfigData);

      expect(result._id).toBe("council1");
      expect(result.tradingStatusLaEmailAddresses).toEqual(["council1@example.com"]);
      expect(result.tradingStatusStandardsEmailAddresses).toBeUndefined();
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionCall",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionSuccess",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
    });

    it("should return LA config with both LA and standards email addresses when LA has separate standards", async () => {
      const result = await getLaConfigWithAllNotifyAddresses("council2-url", mockAllLaConfigData);

      expect(result._id).toBe("council2");
      expect(result.tradingStatusLaEmailAddresses).toEqual(["council2@example.com"]);
      expect(result.tradingStatusStandardsEmailAddresses).toEqual(["standards@example.com"]);
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionCall",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionSuccess",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
    });

    it("should throw an error when LA config is not found", async () => {
      await expect(
        getLaConfigWithAllNotifyAddresses("non-existent-url", mockAllLaConfigData)
      ).rejects.toThrow();

      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionCall",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionFail",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses",
        expect.objectContaining({
          name: "localCouncilNotFound",
          message: 'Config for "non-existent-url" not found'
        })
      );
    });

    it("should throw an error when separate standards council is not found", async () => {
      // Modify the mock data to have an invalid standards council reference
      const invalidMockData = [...mockAllLaConfigData];
      invalidMockData[1].separate_standards_council = "non-existent-council";

      await expect(
        getLaConfigWithAllNotifyAddresses("council2-url", invalidMockData)
      ).rejects.toThrow();

      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionCall",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionFail",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses",
        expect.objectContaining({
          name: "localCouncilNotFound",
          message: expect.stringContaining("non-existent-council")
        })
      );
    });

    it("should work with empty allLaConfigData array", async () => {
      await expect(getLaConfigWithAllNotifyAddresses("any-url", [])).rejects.toThrow();

      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionCall",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionFail",
        "laConfig.service",
        "getLaConfigWithAllNotifyAddresses",
        expect.objectContaining({
          name: "localCouncilNotFound",
          message: 'Config for "any-url" not found'
        })
      );
    });
  });
});
