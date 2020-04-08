const storedStatus = require("../../__mocks__/storedStatusMock.json");

const emails = [{ email: "test@test.com" }];

const statusCollectionDouble = {
  findOne: (query) => {
    if (query._id === "backEndStatus") {
      return storedStatus;
    } else {
      return null;
    }
  },
  updateOne: (query, update) => {
    if (query._id === "backEndStatus") {
      return update;
    } else {
      return null;
    }
  },
  find: () => {
    return {
      project: () => {
        return {
          toArray: () => {
            return emails;
          },
        };
      },
    };
  },
};

module.exports = { statusCollectionDouble };
