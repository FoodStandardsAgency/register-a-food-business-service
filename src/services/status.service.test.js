jest.mock("../connectors/status/status-db.connector");
jest.mock("../connectors/notify/notify.connector");
jest.mock("../config", () => ({
  NOTIFY_STATUS_TEMPLATE: "e6692529-52a3-45cb-96b7-0c8cfe282167"
}));

const {
  getStatus,
  setStatus,
  incrementStatusCount
} = require("./status.service");

const {
  getStoredStatus,
  updateStoredStatus,
  getEmailDistribution
} = require("../connectors/status/status-db.connector");

const { sendStatusEmail } = require("../connectors/notify/notify.connector");

describe("Function: status.service getStatus()", () => {
  let result;

  describe("given a statusName is provided", () => {
    beforeEach(async () => {
      getStoredStatus.mockImplementation(() => ({
        registrationsStarted: 0
      }));
      result = await getStatus("registrationsStarted");
    });

    it("should return the value of that status name", () => {
      expect(result).toBe(0);
    });
  });

  describe("given a statusName is provided that does not exist", () => {
    beforeEach(async () => {
      getStoredStatus.mockImplementation(() => ({
        exampleValid: "status value"
      }));
      result = await getStatus("notValid");
    });

    it("should return undefined", () => {
      expect(result).toBe(undefined);
    });
  });

  describe("given a statusName is not provided", () => {
    beforeEach(async () => {
      getStoredStatus.mockImplementation(() => ({
        registrationsStarted: 0,
        submissionsSucceeded: 0
      }));
      result = await getStatus();
    });

    it("should return the entire status object", () => {
      expect(result).toEqual({
        registrationsStarted: 0,
        submissionsSucceeded: 0
      });
    });
  });
});

describe("Function: status.service setStatus()", () => {
  let result;

  describe("given a the supplied statusName does not exist", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({}));
      updateStoredStatus.mockImplementation(() => "new value");
      getEmailDistribution.mockImplementation(() => ["test@test.com"]);
      result = await setStatus("newStatusItem", "new value");
    });

    it("should return the new value of the status name", () => {
      expect(result).toBe("new value");
    });

    it("should call mocks with the correct values to send an email", () => {
      expect(getEmailDistribution).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenLastCalledWith(
        "e6692529-52a3-45cb-96b7-0c8cfe282167",
        "test@test.com",
        expect.any(Object)
      );
    });
  });

  describe("given sendStatusEmail throws error", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({}));
      updateStoredStatus.mockImplementation(() => "new value");
      getEmailDistribution.mockImplementation(() => ["test@test.com"]);
      sendStatusEmail.mockImplementation(() => {
        throw new Error("cannot send email");
      });
      try {
        await setStatus("newStatusItem", "new value");
      } catch (err) {
        result = err;
      }
    });

    it("should throw an error", () => {
      expect(result.message).toBe("cannot send email");
    });
  });

  describe("given a the supplied statusName already exists with a diffrent value", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({
        mostRecentSubmitSucceeded: true
      }));
      updateStoredStatus.mockImplementation(() => false);
      getEmailDistribution.mockImplementation(() => ["test@test.com"]);
      sendStatusEmail.mockImplementation(() => false);
      result = await setStatus("mostRecentSubmitSucceeded", false);
    });

    it("should return the new value of the status name", () => {
      expect(result).toBe(false);
    });

    it("should call mocks with the correct values to send an email", () => {
      expect(getEmailDistribution).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenLastCalledWith(
        "e6692529-52a3-45cb-96b7-0c8cfe282167",
        "test@test.com",
        expect.any(Object)
      );
    });
  });

  describe("given a the supplied statusName already exists with the same value", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({
        mostRecentSubmitSucceeded: false
      }));
      updateStoredStatus.mockImplementation(() => false);
      getEmailDistribution.mockImplementation(() => ["test@test.com"]);
      sendStatusEmail.mockImplementation(() => false);
      result = await setStatus("mostRecentSubmitSucceeded", false);
    });

    it("should return the new value of the status name", () => {
      expect(result).toBe(false);
    });

    it("should not call mocks showing no email was sent", () => {
      expect(getEmailDistribution).toHaveBeenCalledTimes(0);
      expect(sendStatusEmail).toHaveBeenCalledTimes(0);
    });
  });

  describe("given a the supplied statusName already exists with a diffrent value but empty e-mail list", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({
        mostRecentSubmitSucceeded: true
      }));
      updateStoredStatus.mockImplementation(() => false);
      getEmailDistribution.mockImplementation(() => []);
      sendStatusEmail.mockImplementation(() => false);
      result = await setStatus("mostRecentSubmitSucceeded", false);
    });

    it("should return the new value of the status name", () => {
      expect(result).toBe(false);
    });

    it("should not call mocks showing email list was got but no email was sent", () => {
      expect(getEmailDistribution).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenCalledTimes(0);
    });
  });

  describe("given a the supplied statusName already exists with a diffrent value and multiple email addresses", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      getStoredStatus.mockImplementation(() => ({
        mostRecentSubmitSucceeded: false
      }));
      updateStoredStatus.mockImplementation(() => true);
      getEmailDistribution.mockImplementation(() => [
        "test@test.com",
        "test2@test.com"
      ]);
      sendStatusEmail.mockImplementation(() => false);
      result = await setStatus("mostRecentSubmitSucceeded", true);
    });

    it("should return the new value of the status name", () => {
      expect(result).toBe(true);
    });

    it("should call mocks with the correct values to send two email", () => {
      expect(getEmailDistribution).toHaveBeenCalledTimes(1);
      expect(sendStatusEmail).toHaveBeenCalledTimes(2);
      expect(sendStatusEmail).toHaveBeenLastCalledWith(
        "e6692529-52a3-45cb-96b7-0c8cfe282167",
        "test2@test.com",
        expect.any(Object)
      );
    });
  });
});

describe("status.service incrementStatusCount()", () => {
  let result;

  describe("given existing status value is an integer", () => {
    beforeEach(async () => {
      getStoredStatus.mockImplementation(() => ({
        submissionsSucceeded: 0
      }));
      updateStoredStatus.mockImplementation(() => 1);
      result = await incrementStatusCount("submissionsSucceeded");
    });

    it("should return the updated value of the status name", () => {
      expect(result).toBe(1);
    });
  });

  describe("given existing status value is not an integer", () => {
    beforeEach(async () => {
      getStoredStatus.mockImplementation(() => ({
        mostRecentSubmitSucceeded: true
      }));

      try {
        result = await incrementStatusCount("mostRecentSubmitSucceeded");
      } catch (err) {
        result = err.message;
      }
    });

    it("should throw an error", () => {
      expect(result).toBe(
        `Status name "mostRecentSubmitSucceeded" is not an integer. Unable to increment.`
      );
    });
  });
});
