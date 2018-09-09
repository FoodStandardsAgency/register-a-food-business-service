const { logEmitter } = require("./logging.service");
const {
  getStoredStatus,
  updateStoredStatus
} = require("../connectors/status/status.connector");

const getStatus = async statusName => {
  logEmitter.emit("functionCall", "status.service", "getStatus");
  const status = await getStoredStatus();

  if (statusName) {
    logEmitter.emit(
      "functionSuccessWith",
      "status.service",
      "getStatus",
      `Returning "${statusName}" status of "${status[statusName]}"`
    );
    return status[statusName];
  } else {
    logEmitter.emit(
      "functionSuccessWith",
      "status.service",
      "getStatus",
      `No status name provided. Returning all status values.`
    );
    return status;
  }
};

const setStatus = async (statusName, newStatus) => {
  logEmitter.emit("functionCall", "status.service", "setStatus");

  const updatedStatusValue = await updateStoredStatus(statusName, newStatus);

  logEmitter.emit(
    "functionSuccessWith",
    "status.service",
    "setStatus",
    `Status "${statusName}" set to: ${updatedStatusValue}`
  );
  return updatedStatusValue;
};

const incrementStatusCount = async statusName => {
  logEmitter.emit("functionCall", "status.service", "setStatus");
  const status = await getStoredStatus();
  const currentValue = status[statusName];

  if (Number.isInteger(currentValue)) {
    const newValue = currentValue + 1;

    const updatedStatusValue = await updateStoredStatus(statusName, newValue);

    logEmitter.emit(
      "functionSuccessWith",
      "status.service",
      "incrementStatusCount",
      `Status "${statusName}" incremented. New value is: ${updatedStatusValue}`
    );
    return updatedStatusValue;
  } else {
    const message = `Status name "${statusName}" is not an integer. Unable to increment.`;

    logEmitter.emit(
      "functionFail",
      "status.service",
      "incrementStatusCount",
      message
    );

    throw new Error(message);
  }
};

module.exports = { getStatus, setStatus, incrementStatusCount };
