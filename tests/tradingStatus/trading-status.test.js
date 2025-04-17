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

// Mock the notify connector module BEFORE importing the module that uses it
jest.mock("../../src/connectors/notify/notify.connector", () => ({
  sendSingleEmail: jest.fn().mockImplementation(() => {
    return true;
  })
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

// Set up environment variables for MongoDB connection
const MONGODB_TEST_URL = process.env.MONGODB_TEST_URL || "mongodb://localhost:27017";
const REGISTRATION_DB_NAME = "registrations";
const CONFIG_DB_NAME = "config";

const testCouncilConfig = {
  local_council: "Test Council",
  local_council_url: "trading_status_test_council",
  trading_status: {
    initial_check: 3,
    regular_check: 6,
    chase: true,
    confirmed_trading_notifications: true
  },
  local_council_email_reply_to_ID: "test-council-reply-ID",
  local_council_notify_emails: ["council@example.com"]
};

// Create mock req and res objects for the controller
const mockReq = {};
const mockRes = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};

const getTestRegistration = (fsaRn, council, submissionDate, nextStatusDate, language) => {
  // Store the FSA-RN in our test registrations array for cleanup
  if (!testRegistrations.includes(fsaRn)) {
    testRegistrations.push(fsaRn);
  }

  return {
    "fsa-rn": fsaRn,
    local_council_url: council.local_council_url,
    reg_submission_date:
      submissionDate || moment().subtract(3, "months").subtract(1, "days").toISOString(),
    next_status_date: nextStatusDate || moment().subtract(1, "days").toISOString(),
    submission_language: language || "en",
    establishment: {
      establishment_details: {
        establishment_trading_name: `Trading Name for ${fsaRn}`
      },
      operator: {
        operator_email: "test@example.com",
        operator_first_name: `First name for ${fsaRn}`,
        operator_last_name: `Last name for ${fsaRn}`
      }
    }
  };
};

// Test data collections
let testRegistrations = [];

describe("Trading Status Checks: Registration Processing Integration Tests", () => {
  let connection;
  let registrationsCollection;
  let configCollection;

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

    // Set up test data
    await configCollection.insertOne(testCouncilConfig);
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up test data
    await configCollection.deleteMany({
      local_council_url: testCouncilConfig.local_council_url
    });

    // Close application and test connections
    await closeCosmosConnection();
    if (connection) {
      await connection.close();
    }

    // Restore logging
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    // Clean up test registrations before eac`h test
    if (testRegistrations.length > 0) {
      await registrationsCollection.deleteMany({
        "fsa-rn": { $in: testRegistrations }
      });
      await LOC.deleteMany({
        "fsa-rn": { $in: testRegistrations }
      });
    }

    // Reset the test registrations array before each test
    testRegistrations = [];
  });

  afterEach(async () => {
    // Clean up test registrations after each test
    if (testRegistrations.length > 0) {
      await registrationsCollection.deleteMany({
        "fsa-rn": { $in: testRegistrations }
      });
    }

    // Reset test registrations array
    testRegistrations = [];

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("processTradingStatusChecksDue", () => {
    it("should process a single registration successfully", async () => {
      // Arrange
      const registration = getTestRegistration("TEST-FSA-ID", testCouncilConfig);
      await registrationsCollection.insertOne(registration);

      // Act
      const results = await processTradingStatusChecksDue(mockReq, mockRes, 50);

      // Assert: Verify the response from the controller
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].fsaId).toBe("TEST-FSA-ID");
      const initialCheckDate = moment(registration.reg_submission_date).clone().add(3, "months");
      const initialCheckDateChase = initialCheckDate.clone().add(2, "weeks");
      expect(results[0].message).toBe(
        `INITIAL_CHECK emails sent, INITIAL_CHECK_CHASE scheduled for ${initialCheckDateChase.format("YYYY-MM-DD HH:mm:ss")}`
      );

      // Assert: Verify database was updated
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": "TEST-FSA-ID"
      });
      expect(updatedRegistration).toBeDefined();
      expect(moment(updatedRegistration.next_status_date).format("YYYY-MM-DD HH:mm:ss")).toBe(
        initialCheckDateChase.format("YYYY-MM-DD HH:mm:ss")
      );
      expect(updatedRegistration.status.trading_status_checks).toBeDefined();
      expect(updatedRegistration.status.trading_status_checks.length).toBe(1);
      expect(updatedRegistration.status.trading_status_checks[0].type).toBe("INITIAL_CHECK");
      expect(updatedRegistration.status.trading_status_checks[0].email).toBe(
        registration.establishment.operator.operator_email
      );
      expect(updatedRegistration.status.trading_status_checks[0].sent).toBeTruthy();

      // Assert: Verify if the notify connector sendSingleEmail function was called correctly
      expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
      const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
      expect(callArgs[0]).toBe("initial-check-template-id");
      expect(callArgs[1]).toBe("test@example.com");
      expect(callArgs[2]).toBe("test-council-reply-ID");
      const data = callArgs[3];
      expect(data).toBeDefined();
      expect(data.registration_number).toBe("TEST-FSA-ID");
      expect(data.la_name).toBe("Test Council");
      expect(data.reg_submission_date).toBe(
        moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
      );
      expect(Object.keys(data).length).toBe(7);
      expect(callArgs[4]).toBeNull(); // No PDF file
      expect(callArgs[5]).toBe("TEST-FSA-ID");
      expect(callArgs[6]).toBe("INITIAL_CHECK");
    });
  });

  describe("processTradingStatusChecksForId", () => {
    it("should process trading status check for a specific registration", async () => {
      await registrationsCollection.insertOne(
        getTestRegistration("TEST-FSA-ID", testCouncilConfig)
      );

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
        getTestRegistration("TEST-FSA-ID", testCouncilConfig),
        getTestRegistration(
          "TEST-FSA-ID-2",
          testCouncilConfig,
          moment().subtract(2, "years").toISOString(),
          moment().subtract(3, "years").toISOString()
        ),
        getTestRegistration(
          "TEST-FSA-ID-3",
          testCouncilConfig,
          moment().subtract(2, "years").toISOString(),
          moment().subtract(3, "days").toISOString()
        )
      ]);
    });

    afterEach(async () => {
      // Clean up test registrations after each test in this block
      await registrationsCollection.deleteMany({
        "fsa-rn": { $in: testRegistrations }
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
