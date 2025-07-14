"use strict";

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

// This is the most crucial part - mock the database connector to prevent actual DB calls
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
  updateTradingStatusCheck,
  updateNextStatusDate,
  deleteRegistration
} = require("../connectors/statusChecksDb/status-checks.connector");

// Import the service to test
const {
  processTradingStatus,
  getTradingStatusAction,
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

  describe("processTradingStatus", () => {
    const mockRegistration = {
      _id: "reg123",
      "fsa-rn": "FSA-123456",
      submission_language: "en",
      establishment: {
        operator: {
          operator_first_name: "John",
          operator_last_name: "Doe"
        },
        establishment_details: {
          establishment_trading_name: "Test Food Business"
        }
      },
      trading_status_checks: []
    };

    const mockLaConfig = {
      local_council: "Test Council",
      emailReplyToId: "reply-123",
      trading_status: {
        initial_check: 30,
        regular_check: 180
      }
    };

    test("should throw error if registration dates are not valid", async () => {
      // Act & Assert
      await expect(processTradingStatus(mockRegistration, mockLaConfig)).rejects.toThrow(
        "Trading status checks validation error: Invalid registration submission date for registration FSA-123456"
      );
    });

    test("should handle unsuccessful checks when present", async () => {
      // Arrange
      const mockRegistration = {
        _id: "reg123",
        "fsa-rn": "FSA-123456",
        submission_language: "en",
        reg_submission_date: "2025-06-01",
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
              time: new Date("2025-07-01"),
              sent: false
            }
          ]
        }
      };

      const mockLaConfig = {
        local_council: "Test Council",
        emailReplyToId: "reply-123",
        trading_status: {
          initial_check: 30,
          regular_check: 180
        }
      };

      sendSingleEmail.mockResolvedValue(undefined); // Success case

      // Act
      const result = await processTradingStatus(mockRegistration, mockLaConfig);

      // Assert
      expect(result.fsaId).toBe("FSA-123456");
      expect(result.message).toBe("Previously unsuccessful emails sent");
      expect(sendSingleEmail).toHaveBeenCalled();
    });

    test("should reschedule action when action time is in the future", async () => {
      // Arrange
      const mockRegistration = {
        _id: "reg123",
        "fsa-rn": "FSA-123456",
        submission_language: "en",
        reg_submission_date: "2025-06-01",
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
              time: new Date(),
              sent: true
            }
          ]
        }
      };

      const mockLaConfig = {
        local_council: "Test Council",
        emailReplyToId: "reply-123",
        trading_status: {
          initial_check: 30,
          regular_check: 180
        }
      };

      // Act
      const result = await processTradingStatus(mockRegistration, mockLaConfig);

      // Assert
      expect(result.fsaId).toBe("FSA-123456");
      expect(result.message).toContain("rescheduled for");
      expect(updateNextStatusDate).toHaveBeenCalledWith("FSA-123456", expect.anything());
    });
  });

  describe("getTradingStatusAction", () => {
    const tradingStatusDates = {
      valid: true,
      trading_status_checks: [
        {
          type: INITIAL_REGISTRATION,
          time: new Date("2025-06-01")
        }
      ]
    };

    const laConfig = {
      trading_status: {
        initial_check: 30,
        regular_check: 180
      }
    };
  });

  describe("sendTradingStatusEmails", () => {
    const mockRegistration = {
      _id: "reg123",
      "fsa-rn": "FSA-123456",
      submission_language: "en",
      reg_submission_date: "2025-06-01",
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
        trading_status_checks: []
      }
    };

    const mockLaConfig = {
      local_council: "Test Council",
      emailReplyToId: "reply-123"
    };

    const emailsToSend = [
      {
        type: INITIAL_CHECK,
        address: "test1@example.com",
        templateId: "template-123",
        emailReplyToId: "reply-123"
      },
      {
        type: INITIAL_CHECK,
        address: "test2@example.com",
        templateId: "template-123",
        emailReplyToId: "reply-123"
      }
    ];
    test("should send all emails successfully", async () => {
      // Arrange
      sendSingleEmail.mockResolvedValue(undefined); // Success case

      // Act
      const result = await sendTradingStatusEmails(mockRegistration, mockLaConfig, emailsToSend);

      // Assert
      expect(result).toBe(true);
      expect(sendSingleEmail).toHaveBeenCalledTimes(2);
      expect(updateTradingStatusCheck).toHaveBeenCalledTimes(2);
      expect(logEmitter.emit).toHaveBeenCalledWith(INFO, "Email notification success");
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionSuccess",
        "status-checks.service",
        "sendTradingStatusEmails"
      );
    });
    test("should handle failure to send emails", async () => {
      // Arrange
      sendSingleEmail.mockResolvedValue(null); // Failure case

      // Act
      const result = await sendTradingStatusEmails(mockRegistration, mockLaConfig, emailsToSend);

      // Assert
      expect(result).toBe(false);
      expect(sendSingleEmail).toHaveBeenCalledTimes(2);
      expect(updateTradingStatusCheck).toHaveBeenCalledTimes(2);
      expect(logEmitter.emit).toHaveBeenCalledWith(WARN, "Email notification failure");
      expect(logEmitter.emit).toHaveBeenCalledWith(
        "functionFail",
        "status-checks.service",
        "sendTradingStatusEmails"
      );
    });
    test("should handle mixed success and failure", async () => {
      // Arrange
      // First email succeeds, second fails
      sendSingleEmail
        .mockResolvedValueOnce(undefined) // Success
        .mockResolvedValueOnce(null); // Failure

      // Act
      const result = await sendTradingStatusEmails(mockRegistration, mockLaConfig, emailsToSend);

      // Assert
      expect(result).toBe(false);
      expect(sendSingleEmail).toHaveBeenCalledTimes(2);
      expect(updateTradingStatusCheck).toHaveBeenCalledTimes(2);

      // Should log for both success and failure, but overall result is failure
      expect(logEmitter.emit).toHaveBeenCalledWith(
        INFO,
        "Sent INITIAL_CHECK email to test1@example.com"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(
        ERROR,
        "Failed to send INITIAL_CHECK email to test2@example.com"
      );
      expect(logEmitter.emit).toHaveBeenCalledWith(WARN, "Email notification failure");
    });
    test("should use correct language for i18n", async () => {
      // Arrange
      const welshRegistration = {
        ...mockRegistration,
        submission_language: "cy"
      };

      // Reset previous calls
      jest.clearAllMocks();
      lastLanguage = null;

      // Act
      await sendTradingStatusEmails(welshRegistration, mockLaConfig, emailsToSend);

      // Assert
      expect(lastLanguage).toBe("cy");
      expect(mockTLa).toHaveBeenCalled();
    });
    test("should use default language when not specified", async () => {
      // Arrange
      const registrationNoLanguage = {
        ...mockRegistration,
        submission_language: undefined
      };

      // Reset previous calls
      jest.clearAllMocks();
      lastLanguage = null;

      // Act
      await sendTradingStatusEmails(registrationNoLanguage, mockLaConfig, emailsToSend);

      // Assert
      expect(lastLanguage).toBe("en");
      expect(mockTLa).toHaveBeenCalled();
    });
    test("should format data correctly for notify", async () => {
      // Act
      await sendTradingStatusEmails(mockRegistration, mockLaConfig, [emailsToSend[0]]);

      // Assert
      expect(sendSingleEmail).toHaveBeenCalledWith(
        "template-123",
        "test1@example.com",
        "reply-123",
        expect.objectContaining({
          registration_number: "FSA-123456",
          la_name: expect.stringContaining("Test Council"),
          trading_name: "Test Food Business",
          operator_name: "John Doe",
          trading_yes_link: expect.stringContaining("stilltrading/FSA-123456"),
          trading_no_link: expect.stringContaining("nolongertrading/FSA-123456")
        }),
        null,
        "FSA-123456",
        INITIAL_CHECK
      );
    });
  });
});
