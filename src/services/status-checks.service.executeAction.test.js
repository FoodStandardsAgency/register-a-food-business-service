"use strict";

const moment = require("moment");
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
  DELETE_REGISTRATION,
  FRONT_END_URL
} = require("../config");

// Only mock external services and side effects
jest.mock("./logging.service", () => ({
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  logEmitter: {
    emit: jest.fn()
  }
}));

jest.mock("../connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn()
}));

// Mock the database connector to prevent actual DB calls
const mockUpdateTradingStatusCheck = jest
  .fn()
  .mockImplementation((fsaId, newStatus) => Promise.resolve(true));
const mockUpdateNextStatusDate = jest
  .fn()
  .mockImplementation((fsaId, date) => Promise.resolve(true));
const mockDeleteRegistration = jest.fn().mockImplementation((fsaId) => Promise.resolve(true));

jest.mock("../connectors/statusChecksDb/status-checks.connector", () => ({
  updateTradingStatusCheck: mockUpdateTradingStatusCheck,
  updateNextStatusDate: mockUpdateNextStatusDate,
  deleteRegistration: mockDeleteRegistration
}));

// Mock more complex helper methods
const mockGenerateStatusEmailToSend = jest
  .fn()
  .mockImplementation((registration, type, laConfig) => []);
const mockSendTradingStatusEmails = jest
  .fn()
  .mockImplementation((registration, laConfig, emailsToSend) => Promise.resolve(true));
const mockIsEmailNotificationAction = jest
  .fn()
  .mockImplementation((registration, laConfig, emailsToSend) => true);
const mockGetNextActionAndDate = jest
  .fn()
  .mockImplementation((mostRecentCheck, tradingStatusConfig) => ({
    type: FINISHED_TRADING_LA,
    time: moment.utc("2025-07-09T15:51:49Z")
  }));

jest.mock("../utils/tradingStatusHelpers", () => ({
  generateStatusEmailToSend: mockGenerateStatusEmailToSend,
  sendTradingStatusEmails: mockSendTradingStatusEmails,
  isEmailNotificationAction: mockIsEmailNotificationAction,
  getNextActionAndDate: mockGetNextActionAndDate
}));

jest.mock("../utils/crypto", () => ({
  encryptId: jest.fn((id) => `encrypted-${id}`)
}));

// Mock for i18n class
const mockTLa = jest.fn((text) => `${text} (mock translated)`);
let lastLanguage = null;

jest.mock("../utils/i18n/i18n", () => {
  return class {
    constructor(language) {
      // Store the language for assertion later
      lastLanguage = language || "en";
      this.language = language || "en";
      this.tLa = mockTLa;
    }
  };
});

// Import the actual mocked modules to use in tests
const { logEmitter, INFO, WARN, ERROR } = require("./logging.service");
const { sendSingleEmail } = require("../connectors/notify/notify.connector");
const {
  updateNextStatusDate,
  deleteRegistration
} = require("../connectors/statusChecksDb/status-checks.connector");

// Import the service to test
const {
  processTradingStatus,
  executeAction,
  sendTradingStatusEmails
} = require("./status-checks.service");

describe("Status Checks Service", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up mocked database connector functions
    sendSingleEmail.mockResolvedValue(undefined);
    mockUpdateTradingStatusCheck.mockClear().mockResolvedValue(true);
    mockUpdateNextStatusDate.mockClear().mockResolvedValue(true);
    mockDeleteRegistration.mockClear().mockResolvedValue(true);
  });

  describe("executeAction", () => {
    test("should determine next trading status action and perform current action", async () => {
      // Arrange
      const mockRegistration = {
        _id: "reg123",
        "fsa-rn": "FSA-123456",
        submission_language: "en",
        reg_submission_date: "2024-06-01",
        establishment: {
          operator: {
            operator_first_name: "John",
            operator_last_name: "Doe"
          },
          establishment_details: {
            establishment_trading_name: "Test Food Business"
          }
        },
        status: {
          trading_status_checks: [
            {
              type: INITIAL_CHECK,
              email: "test@example.com",
              time: "2025-06-01",
              sent: true
            }
          ]
        }
      };

      const mockLaConfig = {
        local_council: "Test Council",
        emailReplyToId: "reply-123",
        trading_status: {
          initial_check: 12,
          regular_check: 180
        }
      };

      // Act
      const result = await executeAction(mockRegistration, mockLaConfig, {
        type: INITIAL_CHECK,
        time: moment.utc("2025-06-01")
      });

      // Assert
      const expectedResult = {
        fsaId: "FSA-123456",
        message: "INITIAL_CHECK emails sent, FINISHED_TRADING_LA scheduled for 2025-07-09 15:51:49"
      };
      expect(result).toEqual(expectedResult);
    });

    test("should delete registration as appropriate", async () => {
      // Arrange
      const mockRegistration = {
        _id: "reg123",
        "fsa-rn": "FSA-123456",
        submission_language: "en",
        reg_submission_date: "2024-06-01",
        establishment: {
          operator: {
            operator_first_name: "John",
            operator_last_name: "Doe"
          },
          establishment_details: {
            establishment_trading_name: "Test Food Business"
          }
        },
        status: {
          trading_status_checks: [
            {
              type: INITIAL_CHECK,
              email: "test@example.com",
              time: "2025-06-01",
              sent: true
            }
          ]
        }
      };

      const mockLaConfig = {
        local_council: "Test Council",
        emailReplyToId: "reply-123",
        trading_status: {
          initial_check: 12,
          regular_check: 180
        }
      };

      // Act
      const result = await executeAction(mockRegistration, mockLaConfig, {
        type: DELETE_REGISTRATION,
        time: moment.utc("2025-06-01")
      });

      // Assert
      const expectedResult = {
        fsaId: "FSA-123456",
        message: "Registration deleted"
      };
      expect(result).toEqual(expectedResult);
    });
  });
});
