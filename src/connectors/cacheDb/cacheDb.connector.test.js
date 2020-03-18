jest.mock("mongodb");
jest.mock("../../services/statusEmitter.service");

const mongodb = require("mongodb");
const {
  cacheRegistration,
  clearMongoConnection,
  updateStatusInCache,
  updateNotificationOnSent,
  addNotificationToStatus
} = require("./cacheDb.connector");

describe("Connector: cacheDb", () => {
  let response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Function: cacheRegistration", () => {
    describe("given the request is successful", () => {
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
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
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
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
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "1000" })
            })
          })
        }));

        response = await cacheRegistration({ reg: "data" });

        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              insertOne: () => ({ insertedId: "2000" })
            })
          })
        }));

        response = await cacheRegistration({ reg: "data" });
      });

      it("should have used the first mongo connnection both times", () => {
        expect(response.insertedId).toBe("1000");
      });
    });

    describe("when running in double mode", () => {
      beforeEach(async () => {
        process.env.DOUBLE_MODE = "true";
        response = await cacheRegistration();
      });

      it("should resolve with the data from the double's insertOne()", async () => {
        expect(response.insertedId).toBe("13478de349");
      });
    });
  });

  describe("Function: updateCompletedInCache", () => {
    describe("When success", () => {
      let result;
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              findOne: () => ({ status: { register: undefined } }),
              updateOne: () => {}
            })
          })
        }));

        try {
          await updateStatusInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("should have called this", () => {
        expect(result).toBe(undefined);
      });
    });

    describe("When Failure", () => {
      let result;
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              findOne: () => ({ status: { register: undefined } }),
              updateOne: () => {
                throw new Error("Example mongo error");
              }
            })
          })
        }));

        try {
          await updateStatusInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("Shouldn't throw an error", () => {
        expect(result).toBe(undefined);
      });
    });

    describe("Function: updateNotificationOnCompleted", () => {
      describe("When success", () => {
        let result;
        beforeEach(async () => {
          process.env.DOUBLE_MODE = false;
          clearMongoConnection();
          mongodb.MongoClient.connect.mockImplementation(async () => ({
            db: () => ({
              collection: () => ({
                findOne: () => ({
                  status: {
                    notifications: [
                      {
                        type: "LC",
                        address: "example@example.com",
                        time: undefined,
                        sent: undefined
                      }
                    ]
                  }
                }),
                updateOne: () => {}
              })
            })
          }));

          try {
            await updateNotificationOnSent("123", "LC", "example@example.com");
          } catch (err) {
            result = err;
          }
        });

        it("should have called this", () => {
          expect(result).toBe(undefined);
        });
      });

      describe("When Failure", () => {
        let result;
        beforeEach(async () => {
          process.env.DOUBLE_MODE = false;
          clearMongoConnection();
          mongodb.MongoClient.connect.mockImplementation(async () => ({
            db: () => ({
              collection: () => ({
                findOne: () => ({
                  status: {
                    notifications: [
                      {
                        type: "LC",
                        address: "example@example.com",
                        time: undefined,
                        sent: undefined
                      }
                    ]
                  }
                }),
                updateOne: () => {
                  throw new Error("Example mongo error");
                }
              })
            })
          }));

          try {
            await updateNotificationOnSent("123", "LC", "example@example.com");
          } catch (err) {
            result = err;
          }
        });

        it("Shouldn't throw an error", () => {
          expect(result).toBe(undefined);
        });
      });
    });
  });

  describe("Function: updateCompletedInCache", () => {
    describe("When success", () => {
      let result;
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              findOne: () => ({ completed: { register: undefined } }),
              updateOne: () => {}
            })
          })
        }));

        try {
          await updateStatusInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("should have called this", () => {
        expect(result).toBe(undefined);
      });
    });

    describe("When Failure", () => {
      let result;
      beforeEach(async () => {
        process.env.DOUBLE_MODE = false;
        clearMongoConnection();
        mongodb.MongoClient.connect.mockImplementation(async () => ({
          db: () => ({
            collection: () => ({
              findOne: () => ({ completed: { register: undefined } }),
              updateOne: () => {
                throw new Error("Example mongo error");
              }
            })
          })
        }));

        try {
          await updateStatusInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("Shouldn't throw an error", () => {
        expect(result).toBe(undefined);
      });
    });

    describe("Function: addNotificationToCompleted", () => {
      describe("When success", () => {
        let result;
        beforeEach(async () => {
          process.env.DOUBLE_MODE = false;
          clearMongoConnection();
          mongodb.MongoClient.connect.mockImplementation(async () => ({
            db: () => ({
              collection: () => ({
                findOne: () => ({
                  completed: []
                }),
                updateOne: () => {}
              })
            })
          }));

          try {
            await addNotificationToStatus("123", [
              {
                type: "LC",
                address: "example@example.com"
              }
            ]);
          } catch (err) {
            result = err;
          }
        });

        it("should have called this", () => {
          expect(result).toBe(undefined);
        });
      });

      describe("When Failure", () => {
        let result;
        beforeEach(async () => {
          process.env.DOUBLE_MODE = false;
          clearMongoConnection();
          mongodb.MongoClient.connect.mockImplementation(async () => ({
            db: () => ({
              collection: () => ({
                findOne: () => ({
                  completed: []
                }),
                updateOne: () => {
                  throw new Error("Example mongo error");
                }
              })
            })
          }));

          try {
            await addNotificationToStatus("123", [
              {
                type: "LC",
                address: "example@example.com"
              }
            ]);
          } catch (err) {
            result = err;
          }
        });

        it("Shouldn't throw an error", () => {
          expect(result).toBe(undefined);
        });
      });
    });
  });
});
