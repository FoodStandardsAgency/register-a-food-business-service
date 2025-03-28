jest.mock("mongodb");

const mongodb = require("mongodb");
const { cacheRegistration } = require("../submissionsDb/submissionsDb.connector");
const { updateNotificationOnSent } = require("./notificationsDb.connector");

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
    });
  });
});
