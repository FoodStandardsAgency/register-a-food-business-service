"use strict";

// Set up environment variables required for the tests BEFORE any imports
process.env.COSMOSDB_URL = process.env.MONGODB_TEST_URL || "mongodb://localhost:27017";
process.env.DATA_RETENTION_PERIOD = "7";
process.env.INITIAL_CHECK_TEMPLATE_ID = "initial-check-template-id";
process.env.INITIAL_CHECK_CHASE_TEMPLATE_ID = "initial-check-chase-template-id";
process.env.REGULAR_CHECK_TEMPLATE_ID = "regular-check-template-id";
process.env.REGULAR_CHECK_CHASE_TEMPLATE_ID = "regular-check-chase-template-id";
process.env.FINISHED_TRADING_LA_TEMPLATE_ID = "finished-trading-la-template-id";
process.env.STILL_TRADING_LA_TEMPLATE_ID = "still-trading-la-template-id";
process.env.INITIAL_CHECK_TEMPLATE_ID_CY = "initial-check-template-id-cy";
process.env.INITIAL_CHECK_CHASE_TEMPLATE_ID_CY = "initial-check-chase-template-id-cy";
process.env.REGULAR_CHECK_TEMPLATE_ID_CY = "regular-check-template-id-cy";
process.env.REGULAR_CHECK_CHASE_TEMPLATE_ID_CY = "regular-check-chase-template-id-cy";
process.env.FINISHED_TRADING_LA_TEMPLATE_ID_CY = "finished-trading-la-template-id-cy";
process.env.STILL_TRADING_LA_TEMPLATE_ID_CY = "still-trading-la-template-id-cy";

// Define array to track sent emails for testing
const sentEmails = [];

// Mock the notify connector module
jest.mock("../../src/connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest
    .fn()
    .mockImplementation(
      (templateId, recipientEmail, emailReplyToId, data, pdfFile, fsaId, type) => {
        // Store info about emails sent in the sentEmails array
        sentEmails.push({
          templateId,
          recipientEmail,
          data,
          fsaId: fsaId || "n/a",
          type: type || "n/a"
        });

        // Return a successful response
        return Promise.resolve({
          id: "mock-notification-id",
          content: { body: "Mock email body" },
          reference: "Mock reference"
        });
      }
    )
}));

const moment = require("moment");
const { MongoClient } = require("mongodb");
const { closeCosmosConnection } = require("../../src/connectors/cosmos.client");
const { logEmitter } = require("../../src/services/logging.service");
const notifyConnector = require("../../src/connectors/notify/notify.connector");
const {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId
} = require("../../src/api/tasks/trading-status-checks.controller");

// Create a test MongoDB server URL - we'll use an environment variable or default to localhost
const MONGODB_TEST_URL = process.env.MONGODB_TEST_URL || "mongodb://localhost:27017";
const REGISTRATION_DB_NAME = "registrations";
const CONFIG_DB_NAME = "config";

// Test data
const testRegistration = {
  "fsa-rn": "TEST-FSA-ID",
  reg_submission_date: moment().subtract(3, "months").subtract(1, "days").toISOString(),
  local_council_url: "test-council",
  establishment: {
    operator: {
      operator_email: "test@example.com"
    }
  },
  submission_language: "en",
  next_status_date: moment().subtract(1, "days").toISOString()
};

const testCouncilConfig = {
  local_council_url: "test-council",
  trading_status: {
    initial_check: 3,
    regular_check: 6,
    chase: true,
    confirmed_trading_notifications: true
  },
  local_council_email_reply_to_ID: "test-council-reply-ID",
  local_council_notify_emails: ["council@example.com"]
};

describe("Trading Status Checks Integration Tests", () => {
  let connection;
  let registrationsCollection;
  let configCollection;
  let mockReq;
  let mockRes;

  // Set up the database connection before all tests
  beforeAll(async () => {
    // Suppress logging during tests
    jest.spyOn(logEmitter, "emit").mockImplementation(() => {});

    // Connect to the test database
    connection = await MongoClient.connect(MONGODB_TEST_URL);

    // Create collections and insert test data
    const registrationDb = await connection.db(REGISTRATION_DB_NAME);
    registrationsCollection = registrationDb.collection("registrations");
    const configDb = await connection.db(CONFIG_DB_NAME);
    configCollection = configDb.collection("localAuthorities");

    // Clear only test data by fsa-rn rather than the entire collection
    await registrationsCollection.deleteMany({
      "fsa-rn": { $in: ["TEST-FSA-ID", "TEST-FSA-ID-2", "TEST-FSA-ID-3"] }
    });
    await configCollection.deleteMany({
      local_council_url: "test-council"
    });

    // Set up test data
    await registrationsCollection.insertOne(testRegistration);
    await configCollection.insertOne(testCouncilConfig);
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up only our test data, not the entire collection
    await registrationsCollection.deleteMany({
      "fsa-rn": { $in: ["TEST-FSA-ID", "TEST-FSA-ID-2", "TEST-FSA-ID-3"] }
    });
    await configCollection.deleteMany({
      local_council_url: "test-council"
    });

    // Close application and test connections
    await closeCosmosConnection();
    if (connection) {
      await connection.close();
    }

    // Restore logging
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Create mock req and res objects for the controller
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe("processTradingStatusChecksDue", () => {
    it("should process bulk trading status checks successfully", async () => {
      // Call the controller function directly
      const results = await processTradingStatusChecksDue(mockReq, mockRes, 50);

      // Verify the response from the controller
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].fsaId).toBe("TEST-FSA-ID");
      const initialCheckDate = moment(testRegistration.reg_submission_date).add(3, "months");
      const initialCheckDateChase = initialCheckDate.clone().add(2, "weeks");
      expect(results[0].message).toBe(
        `INITIAL_CHECK emails sent, INITIAL_CHECK_CHASE scheduled for ${initialCheckDateChase.toISOString()}`
      );

      // Verify database was updated
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": "TEST-FSA-ID"
      });
      expect(updatedRegistration).toBeDefined();
      expect(moment(updatedRegistration.next_status_date).format("YYYY-MM-DD")).toBe(
        initialCheckDateChase.format("YYYY-MM-DD")
      );
      expect(updatedRegistration.status.trading_status_checks).toBeDefined();
      expect(updatedRegistration.status.trading_status_checks.length).toBe(1);
      expect(updatedRegistration.status.trading_status_checks[0].type).toBe("INITIAL_CHECK");
      expect(updatedRegistration.status.trading_status_checks[0].email).toBe(
        testRegistration.establishment.operator.operator_email
      );
      expect(updatedRegistration.status.trading_status_checks[0].sent).toBeTruthy();

      // Directly check if the sendSingleEmail function was called
      expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
      const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
      expect(callArgs[0]).toBe("initial-check-template-id");
      expect(callArgs[1]).toBe("test@example.com");
      expect(callArgs[2]).toBe("test-council-reply-ID");
      const data = callArgs[3];
      expect(data).toBeDefined();
      expect(data.fsaRegistrationNumber).toBe("TEST-FSA-ID");
      expect(Object.keys(data).length).toBe(1);
      expect(callArgs[4]).toBeNull(); // No PDF file
      expect(callArgs[5]).toBe("TEST-FSA-ID");
      expect(callArgs[6]).toBe("INITIAL_CHECK");
    });

    it("should respect the throttle parameter", async () => {
      // Call the controller with a specific throttle value
      const results = await processTradingStatusChecksDue(mockReq, mockRes, 10);

      // Verify the controller returned results
      expect(results).toBeDefined();
    });
  });

  describe("processTradingStatusChecksForId", () => {
    it("should process trading status check for a specific registration", async () => {
      // Call the controller function directly
      await processTradingStatusChecksForId("TEST-FSA-ID", mockReq, mockRes);

      // Verify the registration was processed in the database
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": "TEST-FSA-ID"
      });
      expect(updatedRegistration).toBeDefined();
    });

    it("should throw an error if the registration is not found", async () => {
      // Expect the controller to throw an error for a non-existent ID
      await expect(
        processTradingStatusChecksForId("NONEXISTENT-ID", mockReq, mockRes)
      ).rejects.toThrow(/Could not find registration with ID/);
    });
  });

  describe("Multiple registrations", () => {
    beforeEach(async () => {
      // Insert additional test registrations for bulk testing
      await registrationsCollection.insertMany([
        {
          "fsa-rn": "TEST-FSA-ID-2",
          reg_submission_date: moment().subtract(2, "years").toISOString(),
          local_council_url: "test-council",
          establishment: {
            operator: {
              operator_email: "test2@example.com"
            }
          },
          submission_language: "en",
          next_status_date: moment().subtract(3, "years").toISOString()
        },
        {
          "fsa-rn": "TEST-FSA-ID-3",
          reg_submission_date: moment().subtract(2, "years").toISOString(),
          local_council_url: "test-council",
          establishment: {
            operator: {
              operator_email: "test3@example.com"
            }
          },
          submission_language: "en",
          next_status_date: moment().subtract(3, "days").toISOString()
        }
      ]);
    });

    afterEach(async () => {
      // Clean up test registrations after each test in this block
      await registrationsCollection.deleteMany({
        "fsa-rn": { $in: ["TEST-FSA-ID-2", "TEST-FSA-ID-3"] }
      });
    });

    it("should process multiple registrations in bulk", async () => {
      // Process bulk trading status checks
      const results = await processTradingStatusChecksDue(mockReq, mockRes, 50);

      // Verify results were returned
      expect(results).toBeDefined();

      // Verify all registrations were processed
      const processedRegistrations = await registrationsCollection
        .find({
          "fsa-rn": { $in: ["TEST-FSA-ID", "TEST-FSA-ID-2", "TEST-FSA-ID-3"] }
        })
        .toArray();

      expect(processedRegistrations.length).toBe(3);
    });
  });
});
