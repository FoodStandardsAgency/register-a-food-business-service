jest.mock("mongodb");

const mongodb = require("mongodb");
const { saveRegistration } = require("../submissionsDb/submissionsDb.connector");
const { updateNotificationOnSent } = require("./notificationsDb.connector");
const { findAllFailedNotificationsRegistrations } = require("./notificationsDb.connector");

describe("Connector: submissionsDb", () => {
  let response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Function: updateCompletedInCache1", () => {
    describe("Function: updateNotificationOnSent", () => {
      describe("When success", () => {
        let result;
        let testStatus = {
          notifications: [
            {
              type: "LC",
              address: "fsatestemail.valid@gmail.com",
              time: undefined,
              sent: undefined
            }
          ]
        };

        let testEmailsToSend = [
          {
            type: "LC",
            address: "fsatestemail.valid@gmail.com",
            templateId: "testtempate234315431asdfasf"
          }
        ];

        it("check it creates notification rows correctly", () => {
          result = updateNotificationOnSent(
            testStatus,
            "FAKE-FSAID-12345",
            testEmailsToSend,
            0,
            true,
            "fakedate"
          );

          expect(result).toStrictEqual({
            notifications: [
              {
                address: "fsatestemail.valid@gmail.com",
                type: "LC",
                sent: true,
                time: "fakedate"
              }
            ]
          });

          result = updateNotificationOnSent(
            testStatus,
            "FAKE-FSAID-12345",
            testEmailsToSend,
            0,
            false,
            "fakedate"
          );

          expect(result).toStrictEqual({
            notifications: [
              {
                address: "fsatestemail.valid@gmail.com",
                type: "LC",
                sent: false,
                time: "fakedate"
              }
            ]
          });
        });
      });
      describe("Function: findAllFailedNotificationsRegistrations", () => {
        let mockRegistrationsCollection;
        let mockFind;
        let mockSort;
        let mockLimit;
        const mockFailedRegistrations = [
          { "fsa-rn": "TEST-1", status: { notifications: [{ sent: false }] } },
          { "fsa-rn": "TEST-2", status: { notifications: [{ sent: false }] } }
        ];

        beforeEach(() => {
          mockLimit = jest.fn().mockResolvedValue(mockFailedRegistrations);
          mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
          mockFind = jest.fn().mockReturnValue({ sort: mockSort });
          mockRegistrationsCollection = { find: mockFind };
        });

        describe("When given valid parameters", () => {
          it("should call find with correct query parameters", async () => {
            await findAllFailedNotificationsRegistrations(mockRegistrationsCollection);

            expect(mockFind).toHaveBeenCalledWith({
              $and: [
                { "fsa-rn": { $not: { $regex: /^tmp_/ } } },
                {
                  "status.notifications": {
                    $elemMatch: { sent: { $ne: true } }
                  }
                },
                {
                  $or: [
                    { direct_submission: { $exists: false } },
                    { direct_submission: null },
                    { direct_submission: false }
                  ]
                }
              ]
            });
          });
        });
      });
    });
  });
});
