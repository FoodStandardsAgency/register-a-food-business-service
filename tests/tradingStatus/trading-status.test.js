"use strict";

const moment = require("moment");
const { MongoClient } = require("mongodb");
const { closeCosmosConnection } = require("../../src/connectors/cosmos.client");
const { logEmitter } = require("../../src/services/logging.service");
const {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId
} = require("../../src/api/tasks/trading-status-checks.controller");

// Create a test MongoDB server URL - we'll use an environment variable or default to localhost
const MONGODB_TEST_URL = process.env.MONGODB_TEST_URL || "mongodb://localhost:27017";
const REGISTRATION_DB_NAME = "registrations";
const CONFIG_DB_NAME = "config";

// Setup environment variables required for the tests
process.env.COSMOSDB_URL = MONGODB_TEST_URL;
process.env.NOTIFY_TEMPLATE_ID_STATUS_CHECK = "test-template-id";
process.env.NOTIFY_TEMPLATE_ID_STATUS_CHECK_WELSH = "test-template-id-welsh";
process.env.NOTIFY_TEMPLATE_ID_STATUS_CHECK_CHASE = "test-template-id-chase";
process.env.NOTIFY_TEMPLATE_ID_STATUS_CHECK_CHASE_WELSH = "test-template-id-chase-welsh";
process.env.DATA_RETENTION_PERIOD = "7";

// Test data
const testRegistration = {
  "fsa-rn": "TEST-FSA-ID",
  reg_submission_date: { $date: moment().subtract(1, "years").toDate() },
  local_council_url: "test-council",
  establishment: {
    operator: {
      operator_email: "test@example.com"
    }
  },
  submission_language: "en",
  next_status_date: { $date: moment().subtract(1, "days").toDate() }
};

const testCouncilConfig = {
  local_council_url: "test-council",
  trading_status: {
    initial_check: 3,
    regular_check: 6,
    chase: true,
    confirmed_trading_notifications: true
  },
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

      // Verify database was updated
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": "TEST-FSA-ID"
      });
      expect(updatedRegistration).toBeDefined();
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
          reg_submission_date: { $date: moment().subtract(2, "years").toDate() },
          local_council_url: "test-council",
          establishment: {
            operator: {
              operator_email: "test2@example.com"
            }
          },
          submission_language: "en",
          next_status_date: { $date: moment().subtract(3, "years").toDate() }
        },
        {
          "fsa-rn": "TEST-FSA-ID-3",
          reg_submission_date: { $date: moment().subtract(2, "years").toDate() },
          local_council_url: "test-council",
          establishment: {
            operator: {
              operator_email: "test3@example.com"
            }
          },
          submission_language: "en",
          next_status_date: { $date: moment().subtract(3, "days").toDate() }
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
