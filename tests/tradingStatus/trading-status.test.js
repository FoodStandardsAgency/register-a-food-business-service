"use strict";
const crypto = require("crypto");

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
process.env.YEARS_TIME_INTERVAL = "years";
process.env.MONTHS_TIME_INTERVAL = "months";
process.env.WEEKS_TIME_INTERVAL = "weeks";
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");

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
const ENSURE_DELETED_TEST_PREFIX = "ENSURE_DELETED_RECORD-";
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
const noLongerOnboardedCouncilConfig = {
  local_council: "Other Council",
  local_council_url: "other_status_test_council",
  trading_status: {
    chase: true,
    confirmed_trading_notifications: true
  },
  local_council_email_reply_to_ID: "other-council-reply-ID",
  local_council_notify_emails: ["othercouncil@example.com"]
};

const getTestRegistration = (fsaRn, council, submissionDate, nextStatusDate, language) => {
  return {
    _id: fsaRn + Math.random().toString(36).slice(2),
    "fsa-rn": ENSURE_DELETED_TEST_PREFIX + fsaRn,
    local_council_url: council.local_council_url,
    reg_submission_date:
      submissionDate?.toDate() || moment().subtract(3, "months").subtract(1, "days").toDate(),
    next_status_check: nextStatusDate?.toDate() || moment().subtract(1, "days").toDate(),
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
    await configCollection.insertOne(noLongerOnboardedCouncilConfig);
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up test data
    await configCollection.deleteMany({
      local_council_url: testCouncilConfig.local_council_url
    });
    await configCollection.deleteMany({
      local_council_url: noLongerOnboardedCouncilConfig.local_council_url
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
    // Clean up test registrations before each test
    await registrationsCollection.deleteMany({
      "fsa-rn": { $regex: ENSURE_DELETED_TEST_PREFIX }
    });
  });

  afterEach(async () => {
    // Clean up test registrations before each test
    await registrationsCollection.deleteMany({
      "fsa-rn": { $regex: ENSURE_DELETED_TEST_PREFIX }
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("processTradingStatusChecksDue", () => {
    it("should process a single registration successfully resulting in an INITIAL_CHECK", async () => {
      // Arrange
      let registration = getTestRegistration("1", testCouncilConfig);
      await registrationsCollection.insertOne(registration);

      // Act
      const results = await processTradingStatusChecksDue(50);

      // Assert: Verify the response from the controller
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      const initialCheckDateChase = moment().add(2, "weeks");
      expect(results[0].message).toMatch(
        new RegExp(
          `^INITIAL_CHECK emails sent, INITIAL_CHECK_CHASE scheduled for ${initialCheckDateChase.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
        )
      );

      // Assert: Verify database was updated
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
      });
      expect(updatedRegistration).toBeDefined();
      expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
        new RegExp(`^${initialCheckDateChase.toISOString().substring(0, 19)}`)
      );
      expect(updatedRegistration.status.trading_status_checks).toBeDefined();
      expect(updatedRegistration.status.trading_status_checks.length).toBe(1);
      expect(updatedRegistration.status.trading_status_checks[0].type).toBe("INITIAL_CHECK");
      expect(updatedRegistration.status.trading_status_checks[0].address).toBe(
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
      expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      expect(data.la_name).toBe("Test Council");
      expect(data.reg_submission_date).toBe(
        moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
      );
      expect(Object.keys(data).length).toBe(8);
      expect(callArgs[4]).toBeNull(); // No PDF file
      expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      expect(callArgs[6]).toBe("INITIAL_CHECK");
    });

    it("should process a single registration successfully resulting in an INITIAL_CHECK_CHASE", async () => {
      // Arrange
      const registration = getTestRegistration("1", testCouncilConfig);
      const previousStatusDate = moment().subtract(15, "days").toDate();
      registration.next_status_check = moment().subtract(1, "days").toDate();
      registration.status = {
        trading_status_checks: [
          {
            type: "INITIAL_CHECK",
            address: registration.establishment.operator.operator_email,
            time: previousStatusDate,
            sent: true
          }
        ]
      };
      await registrationsCollection.insertOne(registration);

      // Act
      const results = await processTradingStatusChecksDue(50);

      // Assert: Verify the response from the controller
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      const regularCheckDate = moment().clone().add(6, "months");
      expect(results[0].message).toMatch(
        new RegExp(
          `^INITIAL_CHECK_CHASE emails sent, REGULAR_CHECK scheduled for ${regularCheckDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
        )
      );

      // Assert: Verify database was updated
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
      });
      expect(updatedRegistration).toBeDefined();
      expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
        new RegExp(`^${regularCheckDate.toISOString().substring(0, 19)}`)
      );
      expect(updatedRegistration.status.trading_status_checks).toBeDefined();
      expect(updatedRegistration.status.trading_status_checks.length).toBe(2);
      expect(updatedRegistration.status.trading_status_checks[1].type).toBe("INITIAL_CHECK_CHASE");
      expect(updatedRegistration.status.trading_status_checks[1].address).toBe(
        registration.establishment.operator.operator_email
      );
      expect(updatedRegistration.status.trading_status_checks[1].sent).toBeTruthy();

      // Assert: Verify if the notify connector sendSingleEmail function was called correctly
      expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
      const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
      expect(callArgs[0]).toBe("initial-check-chase-template-id");
      expect(callArgs[1]).toBe("test@example.com");
      expect(callArgs[2]).toBe("test-council-reply-ID");
      const data = callArgs[3];
      expect(data).toBeDefined();
      expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      expect(data.la_name).toBe("Test Council");
      expect(data.reg_submission_date).toBe(
        moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
      );
      expect(Object.keys(data).length).toBe(8);
      expect(callArgs[4]).toBeNull(); // No PDF file
      expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
      expect(callArgs[6]).toBe("INITIAL_CHECK_CHASE");
    });
  });

  it("should process a single registration successfully resulting in a REGULAR_CHECK", async () => {
    // Arrange
    const registration = getTestRegistration("1", testCouncilConfig, moment().subtract(3, "years"));
    const previousStatusDate = moment().subtract(6, "months").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "INITIAL_CHECK",
          address: registration.establishment.operator.operator_email,
          time: moment().subtract(6, "months").subtract(2, "weeks").toDate(),
          sent: true
        },
        {
          type: "INITIAL_CHECK_CHASE",
          address: registration.establishment.operator.operator_email,
          time: previousStatusDate,
          sent: true
        }
      ]
    };
    await registrationsCollection.insertOne(registration);

    // Act
    const results = await processTradingStatusChecksDue(50);

    // Assert: Verify the response from the controller
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    const regularCheckChaseDate = moment().clone().add(2, "weeks");
    expect(results[0].message).toMatch(
      new RegExp(
        `^REGULAR_CHECK emails sent, REGULAR_CHECK_CHASE scheduled for ${regularCheckChaseDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
      )
    );

    // Assert: Verify database was updated
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(updatedRegistration).toBeDefined();
    expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
      new RegExp(`^${regularCheckChaseDate.toISOString().substring(0, 19)}`)
    );
    expect(updatedRegistration.status.trading_status_checks).toBeDefined();
    expect(updatedRegistration.status.trading_status_checks.length).toBe(3);
    expect(updatedRegistration.status.trading_status_checks[2].type).toBe("REGULAR_CHECK");
    expect(updatedRegistration.status.trading_status_checks[2].address).toBe(
      registration.establishment.operator.operator_email
    );
    expect(updatedRegistration.status.trading_status_checks[2].sent).toBeTruthy();

    // Assert: Verify if the notify connector sendSingleEmail function was called correctly
    expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
    const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
    expect(callArgs[0]).toBe("regular-check-template-id");
    expect(callArgs[1]).toBe("test@example.com");
    expect(callArgs[2]).toBe("test-council-reply-ID");
    const data = callArgs[3];
    expect(data).toBeDefined();
    expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(data.la_name).toBe("Test Council");
    expect(data.reg_submission_date).toBe(
      moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
    );
    expect(Object.keys(data).length).toBe(8);
    expect(callArgs[4]).toBeNull(); // No PDF file
    expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(callArgs[6]).toBe("REGULAR_CHECK");
  });

  it("should process a single registration successfully resulting in an REGULAR_CHECK_CHASE", async () => {
    // Arrange
    const registration = getTestRegistration("1", testCouncilConfig);
    const previousStatusDate = moment().subtract(15, "days").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "REGULAR_CHECK",
          address: registration.establishment.operator.operator_email,
          time: previousStatusDate,
          sent: true
        }
      ]
    };
    await registrationsCollection.insertOne(registration);

    // Act
    const results = await processTradingStatusChecksDue(50);

    // Assert: Verify the response from the controller
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    const regularCheckDate = moment().clone().add(6, "months");
    expect(results[0].message).toMatch(
      new RegExp(
        `^REGULAR_CHECK_CHASE emails sent, REGULAR_CHECK scheduled for ${regularCheckDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
      )
    );

    // Assert: Verify database was updated
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(updatedRegistration).toBeDefined();
    expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
      new RegExp(`^${regularCheckDate.toISOString().substring(0, 19)}`)
    );
    expect(updatedRegistration.status.trading_status_checks).toBeDefined();
    expect(updatedRegistration.status.trading_status_checks.length).toBe(2);
    expect(updatedRegistration.status.trading_status_checks[1].type).toBe("REGULAR_CHECK_CHASE");
    expect(updatedRegistration.status.trading_status_checks[1].address).toBe(
      registration.establishment.operator.operator_email
    );
    expect(updatedRegistration.status.trading_status_checks[1].sent).toBeTruthy();

    // Assert: Verify if the notify connector sendSingleEmail function was called correctly
    expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
    const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
    expect(callArgs[0]).toBe("regular-check-chase-template-id");
    expect(callArgs[1]).toBe("test@example.com");
    expect(callArgs[2]).toBe("test-council-reply-ID");
    const data = callArgs[3];
    expect(data).toBeDefined();
    expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(data.la_name).toBe("Test Council");
    expect(data.reg_submission_date).toBe(
      moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
    );
    expect(Object.keys(data).length).toBe(8);
    expect(callArgs[4]).toBeNull(); // No PDF file
    expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(callArgs[6]).toBe("REGULAR_CHECK_CHASE");
  });

  it("should process a single registration successfully resulting in a STILL_TRADING_LA", async () => {
    // Arrange
    const registration = getTestRegistration("1", testCouncilConfig);
    const previousStatusDate = moment().subtract(15, "days").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.last_confirmed_trading = moment().subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "REGULAR_CHECK",
          address: registration.establishment.operator.operator_email,
          time: previousStatusDate,
          sent: true
        }
      ]
    };
    await registrationsCollection.insertOne(registration);

    // Act
    const results = await processTradingStatusChecksDue(50);

    // Assert: Verify the response from the controller
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    const regularCheckDate = moment().clone().add(6, "months");
    expect(results[0].message).toMatch(
      new RegExp(
        `^STILL_TRADING_LA emails sent, REGULAR_CHECK scheduled for ${regularCheckDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
      )
    );

    // Assert: Verify database was updated
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(updatedRegistration).toBeDefined();
    expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
      new RegExp(`^${regularCheckDate.toISOString().substring(0, 19)}`)
    );
    expect(updatedRegistration.status.trading_status_checks).toBeDefined();
    expect(updatedRegistration.status.trading_status_checks.length).toBe(2);
    expect(updatedRegistration.status.trading_status_checks[1].type).toBe("STILL_TRADING_LA");
    expect(updatedRegistration.status.trading_status_checks[1].address).toBe(
      testCouncilConfig.local_council_notify_emails[0]
    );
    expect(updatedRegistration.status.trading_status_checks[1].sent).toBeTruthy();

    // Assert: Verify if the notify connector sendSingleEmail function was called correctly
    expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
    const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
    expect(callArgs[0]).toBe("still-trading-la-template-id");
    expect(callArgs[1]).toBe("council@example.com");
    expect(callArgs[2]).toBeUndefined(); // No reply-to ID for LA emails
    const data = callArgs[3];
    expect(data).toBeDefined();
    expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(data.la_name).toBe("Test Council");
    expect(data.reg_submission_date).toBe(
      moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
    );
    expect(Object.keys(data).length).toBe(8);
    expect(callArgs[4]).toBeNull(); // No PDF file
    expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(callArgs[6]).toBe("STILL_TRADING_LA");
  });

  it("should process a single registration successfully resulting in a FINISHED_TRADING_LA", async () => {
    // Arrange
    const registration = getTestRegistration("1", testCouncilConfig);
    const previousStatusDate = moment().subtract(15, "days").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.confirmed_not_trading = moment().subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "REGULAR_CHECK",
          address: registration.establishment.operator.operator_email,
          time: previousStatusDate,
          sent: true
        }
      ]
    };
    await registrationsCollection.insertOne(registration);

    // Act
    const results = await processTradingStatusChecksDue(50);

    // Assert: Verify the response from the controller
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    const deleteDate = moment().clone().add(7, "years");
    expect(results[0].message).toMatch(
      new RegExp(
        `^FINISHED_TRADING_LA emails sent, DELETE_REGISTRATION scheduled for ${deleteDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
      )
    );

    // Assert: Verify database was updated
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(updatedRegistration).toBeDefined();
    expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
      new RegExp(`^${deleteDate.toISOString().substring(0, 19)}`)
    );
    expect(updatedRegistration.status.trading_status_checks).toBeDefined();
    expect(updatedRegistration.status.trading_status_checks.length).toBe(2);
    expect(updatedRegistration.status.trading_status_checks[1].type).toBe("FINISHED_TRADING_LA");
    expect(updatedRegistration.status.trading_status_checks[1].address).toBe(
      testCouncilConfig.local_council_notify_emails[0]
    );
    expect(updatedRegistration.status.trading_status_checks[1].sent).toBeTruthy();

    // Assert: Verify if the notify connector sendSingleEmail function was called correctly
    expect(notifyConnector.sendSingleEmail).toHaveBeenCalled();
    const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
    expect(callArgs[0]).toBe("finished-trading-la-template-id");
    expect(callArgs[1]).toBe("council@example.com");
    expect(callArgs[2]).toBeUndefined(); // No reply-to ID for LA emails
    const data = callArgs[3];
    expect(data).toBeDefined();
    expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(data.la_name).toBe("Test Council");
    expect(data.reg_submission_date).toBe(
      moment(registration.reg_submission_date).clone().format("DD MMM YYYY")
    );
    expect(Object.keys(data).length).toBe(8);
    expect(callArgs[4]).toBeNull(); // No PDF file
    expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(callArgs[6]).toBe("FINISHED_TRADING_LA");
  });

  it("should process a single registration successfully resulting in a DELETE_REGISTRATION", async () => {
    // Arrange
    const registration = getTestRegistration(
      "1",
      testCouncilConfig,
      moment().subtract(10, "years")
    );
    const previousStatusDate = moment().subtract(7, "years").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.confirmed_not_trading = moment().subtract(7, "years").subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "FINISHED_TRADING_LA",
          address: testCouncilConfig.local_council_notify_emails[0],
          time: previousStatusDate,
          sent: true
        }
      ]
    };

    await registrationsCollection.insertOne(registration);

    const unProcessedRegistration = getTestRegistration(
      "2",
      testCouncilConfig,
      moment().subtract(10, "years")
    );
    unProcessedRegistration.confirmed_not_trading = moment()
      .subtract(7, "years")
      .add(1, "days")
      .toDate();
    const previousStatusDate2 = moment().subtract(7, "years").add(2, "days");
    unProcessedRegistration.status = {
      trading_status_checks: [
        {
          type: "FINISHED_TRADING_LA",
          address: testCouncilConfig.local_council_notify_emails[0],
          time: previousStatusDate2.toDate(),
          sent: true
        }
      ]
    };

    await registrationsCollection.insertOne(unProcessedRegistration);

    // Act
    const results = await processTradingStatusChecksDue(50);

    // Assert: Verify the response from the controller
    const deleteDate = previousStatusDate2.clone().add(7, "years");
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(results[0].message).toMatch(new RegExp(`^Registration deleted`));
    expect(results[1].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}2`);
    expect(results[1].message).toMatch(
      new RegExp(
        `^DELETE_REGISTRATION rescheduled for ${deleteDate.format("YYYY-MM-DD HH:mm")}:\\d{2}$`
      )
    );

    // Assert: Verify database was updated
    const deletedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(deletedRegistration).toBeNull();
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}2`
    });
    expect(updatedRegistration).toBeDefined();
    expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
      new RegExp(`^${deleteDate.toISOString().substring(0, 19)}`)
    );

    expect(notifyConnector.sendSingleEmail).not.toHaveBeenCalled();
  });

  it("should process a single registration successfully resulting in an undefined next_status_date", async () => {
    // Arrange
    const registration = getTestRegistration("1", noLongerOnboardedCouncilConfig);
    const previousStatusDate = moment().subtract(15, "days").toDate();
    registration.next_status_check = moment().subtract(1, "days").toDate();
    registration.confirmed_not_trading = moment().subtract(1, "days").toDate();
    registration.status = {
      trading_status_checks: [
        {
          type: "REGULAR_CHECK",
          address: registration.establishment.operator.operator_email,
          time: previousStatusDate,
          sent: true
        }
      ]
    };
    await registrationsCollection.insertOne(registration);

    // Act
    const results = await processTradingStatusChecksDue(10);

    // Assert: Verify the response from the controller
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}1`);
    expect(results[0].message).toMatch(new RegExp(`^No action needed, next status date cleared`));

    // Assert: Verify database was updated
    const updatedRegistration = await registrationsCollection.findOne({
      "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
    });
    expect(updatedRegistration).toBeDefined();
    expect(updatedRegistration.next_status_check).not.toBeDefined();
    expect(updatedRegistration.status.trading_status_checks).toBeDefined();
    expect(updatedRegistration.status.trading_status_checks.length).toBe(1);

    // Assert: Verify if the notify connector sendSingleEmail function was called correctly
    expect(notifyConnector.sendSingleEmail).not.toHaveBeenCalled();
  });

  describe("processTradingStatusChecksForId", () => {
    it("should process trading status check for a specific registration", async () => {
      const registrationToRemainUnprocessed = getTestRegistration("1", testCouncilConfig);
      const registrationToUpdate = getTestRegistration("2", testCouncilConfig);
      await registrationsCollection.insertOne(registrationToRemainUnprocessed);
      await registrationsCollection.insertOne(registrationToUpdate);

      const result = await processTradingStatusChecksForId(`${ENSURE_DELETED_TEST_PREFIX}2`);

      // Assert: Verify the response from the controller
      expect(result).toBeDefined();
      expect(result.fsaId).toBe(`${ENSURE_DELETED_TEST_PREFIX}2`);
      const initialCheckDate = moment(registrationToUpdate.reg_submission_date)
        .clone()
        .add(3, "months");
      const initialCheckDateChase = moment().add(2, "weeks");
      expect(result.message).toBe(
        `INITIAL_CHECK emails sent, INITIAL_CHECK_CHASE scheduled for ${initialCheckDateChase.format("YYYY-MM-DD HH:mm:ss")}`
      );

      // Assert: Verify registration 1 was NOT updated in database
      const unprocessedRegistration = await registrationsCollection.findOne({
        "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}1`
      });
      expect(unprocessedRegistration).toBeDefined();
      expect(moment(unprocessedRegistration.next_status_check).toISOString()).toBe(
        registrationToRemainUnprocessed.next_status_check.toISOString()
      );
      expect(unprocessedRegistration.status).toBeUndefined();

      // Assert: Verify registration 2 was updated in database
      const updatedRegistration = await registrationsCollection.findOne({
        "fsa-rn": `${ENSURE_DELETED_TEST_PREFIX}2`
      });
      expect(updatedRegistration).toBeDefined();
      expect(moment(updatedRegistration.next_status_check).toISOString()).toMatch(
        new RegExp(`^${initialCheckDateChase.toISOString().substring(0, 19)}`)
      );
      expect(updatedRegistration.status.trading_status_checks).toBeDefined();
      expect(updatedRegistration.status.trading_status_checks.length).toBe(1);
      expect(updatedRegistration.status.trading_status_checks[0].type).toBe("INITIAL_CHECK");
      expect(updatedRegistration.status.trading_status_checks[0].address).toBe(
        registrationToUpdate.establishment.operator.operator_email
      );
      expect(updatedRegistration.status.trading_status_checks[0].sent).toBeTruthy();

      // Assert: Verify if the notify connector sendSingleEmail function was called once and correctly
      expect(notifyConnector.sendSingleEmail).toHaveBeenCalledTimes(1);
      const callArgs = notifyConnector.sendSingleEmail.mock.calls[0];
      expect(callArgs[0]).toBe("initial-check-template-id");
      expect(callArgs[1]).toBe("test@example.com");
      expect(callArgs[2]).toBe("test-council-reply-ID");
      const data = callArgs[3];
      expect(data).toBeDefined();
      expect(data.registration_number).toBe(`${ENSURE_DELETED_TEST_PREFIX}2`);
      expect(data.la_name).toBe("Test Council");
      expect(data.trading_no_link).toMatch(
        new RegExp(`http://localhost:3000/tradingstatus/nolongertrading/ENSURE_DELETED_RECORD-2?`)
      );
      expect(data.trading_yes_link).toMatch(
        new RegExp(`http://localhost:3000/tradingstatus/stilltrading/ENSURE_DELETED_RECORD-2?`)
      );
      expect(data.reg_submission_date).toBe(
        moment(registrationToUpdate.reg_submission_date).clone().format("DD MMM YYYY")
      );
      expect(Object.keys(data).length).toBe(8);
      expect(callArgs[4]).toBeNull(); // No PDF file
      expect(callArgs[5]).toBe(`${ENSURE_DELETED_TEST_PREFIX}2`);
      expect(callArgs[6]).toBe("INITIAL_CHECK");
    });

    it("should throw an error if the registration is not found", async () => {
      // Expect the controller to throw an error for a non-existent ID
      await expect(processTradingStatusChecksForId("NONEXISTENT-ID")).rejects.toThrow(
        /Could not find registration with ID/
      );
    });
  });

  describe("Multiple registrations", () => {
    beforeEach(async () => {
      // Insert additional test registrations for bulk testing
      await registrationsCollection.insertMany([
        getTestRegistration(`1`, testCouncilConfig),
        getTestRegistration(
          `2`,
          testCouncilConfig,
          moment().subtract(2, "years"),
          moment().subtract(3, "years")
        ),
        getTestRegistration(
          `3`,
          testCouncilConfig,
          moment().subtract(2, "years"),
          moment().subtract(3, "days")
        )
      ]);
    });

    afterEach(async () => {
      // Clean up test registrations before each test
      await registrationsCollection.deleteMany({
        "fsa-rn": { $regex: ENSURE_DELETED_TEST_PREFIX }
      });
    });

    it("should process multiple registrations in bulk", async () => {
      // Process bulk trading status checks
      const results = await processTradingStatusChecksDue(50);

      // Verify results were returned
      expect(results).toBeDefined();

      // Verify all registrations were processed
      const processedRegistrations = await registrationsCollection
        .find({
          "fsa-rn": {
            $in: [
              `${ENSURE_DELETED_TEST_PREFIX}1`,
              `${ENSURE_DELETED_TEST_PREFIX}2`,
              `${ENSURE_DELETED_TEST_PREFIX}3`
            ]
          }
        })
        .toArray();

      expect(processedRegistrations.length).toBe(3);
    });
  });
});
