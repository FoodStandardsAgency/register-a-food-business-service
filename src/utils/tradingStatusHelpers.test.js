const moment = require("moment");
const { getNextActionAndDate, getVerifiedRegistrationDates } = require("./tradingStatusHelpers");
const {
  INITIAL_REGISTRATION,
  INITIAL_CHECK,
  INITIAL_CHECK_CHASE,
  REGULAR_CHECK,
  REGULAR_CHECK_CHASE,
  CONFIRMED_TRADING,
  CONFIRMED_NOT_TRADING,
  FINISHED_TRADING_LA,
  STILL_TRADING_LA,
  DELETE_REGISTRATION
} = require("../config");

describe("getNextActionAndDate", () => {
  // Sample config for tests
  const tradingStatusConfig = {
    initial_check: 6,
    regular_check: 12,
    chase: true,
    confirmed_trading_notifications: true,
    data_retention_period: 7
  };

  const laConfig = {
    data_retention_period: 2 // years
  };

  // Helper function to create mock recent check objects
  const createMockRecentCheck = (type, time) => ({
    type,
    time: time ? moment(time) : moment().subtract(2, "months")
  });

  // Helper function to compare date objects for equality in tests
  const compareDateEquality = (actual, expected) => {
    return actual.format() === expected.format();
  };

  describe("Special cases", () => {
    test("should return FINISHED_TRADING_LA when most recent check is CONFIRMED_NOT_TRADING", () => {
      const mockRecentCheck = createMockRecentCheck(CONFIRMED_NOT_TRADING);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(FINISHED_TRADING_LA);
      expect(result.time).toBe(mockRecentCheck.time);
    });

    test("should return DELETE_REGISTRATION when most recent check is FINISHED_TRADING_LA", () => {
      const mockRecentCheck = createMockRecentCheck(FINISHED_TRADING_LA);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("years", tradingStatusConfig.data_retention_period);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(DELETE_REGISTRATION);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule STILL_TRADING_LA when most recent is CONFIRMED_TRADING and confirmed trading notifications are enabled", () => {
      const mockRecentCheck = createMockRecentCheck(CONFIRMED_TRADING);
      tradingStatusConfig.confirmed_trading_notifications = true;
      const expectedTime = mockRecentCheck.time.clone();

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(STILL_TRADING_LA);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Initial check cases", () => {
    test("should schedule INITIAL_CHECK when most recent is INITIAL_REGISTRATION and initial_check is configured", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_REGISTRATION);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.initial_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(INITIAL_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule overdue INITIAL_CHECK in the future", () => {
      const mockRecentCheck = createMockRecentCheck(
        INITIAL_REGISTRATION,
        moment().subtract(2, "years")
      );
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.initial_check)
        .add(2, "years");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(INITIAL_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is INITIAL_REGISTRATION but initial_check is not configured", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_REGISTRATION);
      const configWithoutInitial = { ...tradingStatusConfig, initial_check: null };
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", configWithoutInitial.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, configWithoutInitial);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule overdue REGULAR_CHECK in the future", () => {
      const mockRecentCheck = createMockRecentCheck(
        INITIAL_REGISTRATION,
        moment().subtract(3, "years")
      );
      const configWithoutInitial = { ...tradingStatusConfig, initial_check: null };
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", configWithoutInitial.regular_check)
        .add(3, "years");

      const result = getNextActionAndDate(mockRecentCheck, configWithoutInitial);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Chase notification cases", () => {
    test("should schedule INITIAL_CHECK_CHASE when most recent is INITIAL_CHECK and chase is enabled", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK, moment().subtract(3, "weeks"));
      const expectedTime = mockRecentCheck.time.clone().add("weeks", 2);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(INITIAL_CHECK_CHASE);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should not schedule chase when chase is disabled", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK);
      const configWithoutChase = { ...tradingStatusConfig, chase: false };
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", configWithoutChase.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, configWithoutChase);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK_CHASE when most recent is REGULAR_CHECK and chase is enabled", () => {
      const mockRecentCheck = createMockRecentCheck(REGULAR_CHECK, moment().subtract(3, "weeks"));
      const expectedTime = mockRecentCheck.time.clone().add("weeks", 2);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK_CHASE);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should not schedule chase when sanity check fails (chase would be too late)", () => {
      const mockRecentCheck = createMockRecentCheck(
        REGULAR_CHECK,
        moment().subtract(6, "months").format()
      );
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Regular check cases", () => {
    test("should schedule REGULAR_CHECK when most recent is CONFIRMED_TRADING and confirmed trading notifications are not enabled", () => {
      const mockRecentCheck = createMockRecentCheck(CONFIRMED_TRADING);
      tradingStatusConfig.confirmed_trading_notifications = false;
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is STILL_TRADING_LA", () => {
      const mockRecentCheck = createMockRecentCheck(STILL_TRADING_LA);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is INITIAL_CHECK_CHASE", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK_CHASE);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is REGULAR_CHECK_CHASE", () => {
      const mockRecentCheck = createMockRecentCheck(REGULAR_CHECK_CHASE);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add("months", tradingStatusConfig.regular_check);

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    test("should return null when regular_check is not configured", () => {
      const mockRecentCheck = createMockRecentCheck(CONFIRMED_TRADING);
      const minimalConfig = { chase: true };

      const result = getNextActionAndDate(mockRecentCheck, minimalConfig);

      expect(result).toBeNull();
    });

    test("should handle completely empty config", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_REGISTRATION);
      const emptyConfig = {};

      const result = getNextActionAndDate(mockRecentCheck, emptyConfig);

      expect(result).toBeNull();
    });
  });
});

describe("getVerifiedRegistrationDates", () => {
  test("should return valid dates for a complete and valid registration object", () => {
    const registration = {
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z"),
      last_confirmed_trading: new Date("2023-06-01T00:00:00.000Z"),
      status: {
        trading_status_checks: [
          { type: "REGULAR_CHECK", time: new Date("2023-05-01T00:00:00.000Z"), success: true },
          { type: "INITIAL_CHECK", time: new Date("2023-02-01T00:00:00.000Z"), success: false }
        ]
      }
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(true);
    expect(
      result.trading_status_checks.find((x) => x.type == INITIAL_REGISTRATION).time.toISOString()
    ).toBe("2023-01-01T00:00:00.000Z");
    expect(
      result.trading_status_checks.find((x) => x.type == CONFIRMED_TRADING).time.toISOString()
    ).toBe("2023-06-01T00:00:00.000Z");
    expect(
      result.trading_status_checks.find((x) => x.type == REGULAR_CHECK).time.toISOString()
    ).toBe("2023-05-01T00:00:00.000Z");
    expect(
      result.trading_status_checks.find((x) => x.type == INITIAL_CHECK).time.toISOString()
    ).toBe("2023-02-01T00:00:00.000Z");
    expect(result.trading_status_checks).toHaveLength(4);
  });

  test("should return invalid when reg_submission_date is missing or invalid", () => {
    const registration = {
      "fsa-rn": "123456789",
      reg_submission_date: new Date("invalid-date"),
      last_confirmed_trading: new Date("2023-06-01T00:00:00.000Z")
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid registration submission date for registration 123456789");
  });

  test("should return invalid when last_confirmed_trading is invalid", () => {
    const registration = {
      "fsa-rn": "123456789",
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z"),
      last_confirmed_trading: new Date("invalid-date")
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid last confirmed trading date for registration 123456789");
  });

  test("should return invalid when confirmed_not_trading is invalid", () => {
    const registration = {
      "fsa-rn": "123456789",
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z"),
      confirmed_not_trading: new Date("invalid-date")
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid finished trading date for registration 123456789");
  });

  test("should return invalid when last_confirmed_trading is after confirmed_not_trading", () => {
    const registration = {
      "fsa-rn": "123456789",
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z"),
      last_confirmed_trading: new Date("2023-01-02T00:00:00.000Z"),
      confirmed_not_trading: new Date("2023-01-01T00:00:00.000Z")
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      "Last confirmed trading date is after finished trading date for registration 123456789"
    );
  });

  test("should handle missing trading_status_checks gracefully", () => {
    const registration = {
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z")
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(true);
    expect(result.trading_status_checks).toHaveLength(1); // Only INITIAL_REGISTRATION
  });

  test("should return invalid when a trading_status_check has an invalid date", () => {
    const registration = {
      "fsa-rn": "123456789",
      reg_submission_date: new Date("2023-01-01T00:00:00.000Z"),
      status: {
        trading_status_checks: [
          { type: "REGULAR_CHECK", time: new Date("invalid-date"), success: true }
        ]
      }
    };

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      "Invalid trading status check date for REGULAR_CHECK for registration 123456789"
    );
  });

  test("should handle empty registration object gracefully", () => {
    const registration = {};

    const result = getVerifiedRegistrationDates(registration);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid registration submission date for registration undefined");
  });
});
