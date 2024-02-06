jest.mock("mongodb");

const mongodb = require("mongodb");
const { cacheRegistration, updateNotificationOnSent } = require("./cacheDb.connector");

describe("Connector: cacheDb", () => {
  let response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Function: cacheRegistration", () => {
    describe("given the request is successful", () => {
      beforeEach(async () => {
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "764" })
            })
          })
        }));
        response = await cacheRegistration({ reg: "data" });
      });

      it("should return the response from the insertOne()", () => {
        expect(response.insertedId).toBe("764");
      });
    });

    describe("given the request throws an error", () => {
      beforeEach(async () => {
        mongodb.MongoClient.connect.mockImplementation(() => ({
          db: () => ({
            collection: () => ({
              insertOne: () => {
                throw new Error("Example mongo error");
              }
            })
          })
        }));
        try {
          response = await cacheRegistration({ reg: "data" });
        } catch (err) {
          response = err;
        }
      });

      it("should catch the error", () => {
        expect(response.message).toBe("Example mongo error");
      });
    });

    describe("given two requests without clearing the mongo connection", () => {
      beforeEach(async () => {
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "1000" })
            })
          }),
          topology: {
            isConnected: () => true
          }
        }));

        response = await cacheRegistration({ reg: "data" });

        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "2000" })
            })
          }),
          topology: {
            isConnected: () => true
          }
        }));

        response = await cacheRegistration({ reg: "data" });
      });

      it("should have used the first mongo connnection both times", () => {
        expect(response.insertedId).toBe("1000");
      });
    });
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
