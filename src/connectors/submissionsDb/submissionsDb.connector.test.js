jest.mock("mongodb");

const mongodb = require("mongodb");
const { saveRegistration, updateNotificationOnSent } = require("./submissionsDb.connector");

describe("Connector: submissionsDb", () => {
  let response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Function: saveRegistration", () => {
    describe("given the request is successful", () => {
      beforeEach(async () => {
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "764" })
            })
          })
        }));
        response = await saveRegistration({ reg: "data" });
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
          response = await saveRegistration({ reg: "data" });
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

        response = await saveRegistration({ reg: "data" });

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

        response = await saveRegistration({ reg: "data" });
      });

      it("should have used the first mongo connnection both times", () => {
        expect(response.insertedId).toBe("1000");
      });
    });
  });
});
