const moment = require("moment");
const { getNextActionAndDate } = require("./status-checks.service");
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
        .add(tradingStatusConfig.data_retention_period, "years");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(DELETE_REGISTRATION);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Initial check cases", () => {
    test("should schedule INITIAL_CHECK when most recent is INITIAL_REGISTRATION and initial_check is configured", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_REGISTRATION);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(tradingStatusConfig.initial_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(INITIAL_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is INITIAL_REGISTRATION but initial_check is not configured", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_REGISTRATION);
      const configWithoutInitial = { ...tradingStatusConfig, initial_check: null };
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(configWithoutInitial.regular_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, configWithoutInitial);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Chase notification cases", () => {
    test("should schedule INITIAL_CHECK_CHASE when most recent is INITIAL_CHECK and chase is enabled", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK, moment().subtract(3, "weeks"));
      const expectedTime = mockRecentCheck.time.clone().add(2, "weeks");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(INITIAL_CHECK_CHASE);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should not schedule chase when chase is disabled", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK);
      const configWithoutChase = { ...tradingStatusConfig, chase: false };
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(configWithoutChase.regular_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, configWithoutChase);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK_CHASE when most recent is REGULAR_CHECK and chase is enabled", () => {
      const mockRecentCheck = createMockRecentCheck(REGULAR_CHECK, moment().subtract(3, "weeks"));
      const expectedTime = mockRecentCheck.time.clone().add(2, "weeks");

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
        .add(tradingStatusConfig.regular_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });
  });

  describe("Regular check cases", () => {
    test("should schedule REGULAR_CHECK when most recent is CONFIRMED_TRADING", () => {
      const mockRecentCheck = createMockRecentCheck(CONFIRMED_TRADING);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(tradingStatusConfig.regular_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is INITIAL_CHECK_CHASE", () => {
      const mockRecentCheck = createMockRecentCheck(INITIAL_CHECK_CHASE);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(tradingStatusConfig.regular_check, "months");

      const result = getNextActionAndDate(mockRecentCheck, tradingStatusConfig);

      expect(result.type).toEqual(REGULAR_CHECK);
      expect(compareDateEquality(result.time, expectedTime)).toBeTruthy();
    });

    test("should schedule REGULAR_CHECK when most recent is REGULAR_CHECK_CHASE", () => {
      const mockRecentCheck = createMockRecentCheck(REGULAR_CHECK_CHASE);
      const expectedTime = mockRecentCheck.time
        .clone()
        .add(tradingStatusConfig.regular_check, "months");

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
