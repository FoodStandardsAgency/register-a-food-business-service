const { getStoredStatus, updateStoredStatus } = require("./status.connector");

describe("Function: getStoredStatus", () => {
  let result;

  beforeEach(async () => {
    result = await getStoredStatus();
  });

  it("Should return an object", () => {
    expect(typeof result).toBe("object");
  });
});

describe("Function: updateStoredStatus", () => {
  let result;
  let storedStatus;

  beforeEach(async () => {
    result = await updateStoredStatus("submissionsSucceeded", 3);
    storedStatus = await getStoredStatus();
  });

  it("Should return the updated value", () => {
    expect(result).toBe(3);
  });

  it("Should have stored the new value", async () => {
    expect(storedStatus.submissionsSucceeded).toBe(3);
  });
});
