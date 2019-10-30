const mongodb = require("mongodb");
const {
  cacheRegistration,
  clearMongoConnection,
  updateCompletedInCache,
  updateNotificationOnCompleted,
  addNotificationToCompleted
} = require("./cacheDb.connector");

jest.mock("mongodb");
jest.mock("../../services/statusEmitter.service");

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
              findOne: () => ({ completed: { register: undefined } }),
              updateOne: () => {}
            })
          })
        }));

        try {
          await updateCompletedInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("should have aclled this", () => {
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
          await updateCompletedInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("Should throw an error", () => {
        expect(result.message).toBe("Example mongo error");
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
                  completed: {
                    notifications: [
                      {
                        type: "LC",
                        address: "example@example.com",
                        time: undefined,
                        result: undefined
                      }
                    ]
                  }
                }),
                updateOne: () => {}
              })
            })
          }));

          try {
            await updateNotificationOnCompleted(
              "123",
              "LC",
              "example@example.com",
              "success"
            );
          } catch (err) {
            result = err;
          }
        });

        it("should have aclled this", () => {
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
                  completed: {
                    notifications: [
                      {
                        type: "LC",
                        address: "example@example.com",
                        time: undefined,
                        result: undefined
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
            await updateNotificationOnCompleted(
              "123",
              "LC",
              "example@example.com",
              "failure"
            );
          } catch (err) {
            result = err;
          }
        });

        it("Should throw an error", () => {
          expect(result.message).toBe("Example mongo error");
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
          await updateCompletedInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("should have aclled this", () => {
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
          await updateCompletedInCache("123", "123", "123");
        } catch (err) {
          result = err;
        }
      });

      it("Should throw an error", () => {
        expect(result.message).toBe("Example mongo error");
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
            await addNotificationToCompleted("123", [
              {
                type: "LC",
                address: "example@example.com"
              }
            ]);
          } catch (err) {
            result = err;
          }
        });

        it("should have aclled this", () => {
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
            await addNotificationToCompleted("123", [
              {
                type: "LC",
                address: "example@example.com"
              }
            ]);
          } catch (err) {
            result = err;
          }
        });

        it("Should throw an error", () => {
          expect(result.message).toBe("Example mongo error");
        });
      });
    });
  });
});
