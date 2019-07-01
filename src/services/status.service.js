const {
  getStoredStatus,
  updateStoredStatus
} = require("../connectors/status/status-db.connector");

const getStatus = async statusName => {
  const status = await getStoredStatus();
  return statusName ? status[statusName] : status;
};

const setStatus = async (statusName, newStatus) => {
  const updatedStatusValue = await updateStoredStatus(statusName, newStatus);
  return updatedStatusValue;
};

const incrementStatusCount = async statusName => {
  const status = await getStoredStatus();
  const currentValue = status[statusName];

  if (Number.isInteger(currentValue)) {
    const newValue = currentValue + 1;
    const updatedStatusValue = await updateStoredStatus(statusName, newValue);
    return updatedStatusValue;
  } else {
    const message = `Status name "${statusName}" is not an integer. Unable to increment.`;
    throw new Error(message);
  }
};

module.exports = { getStatus, setStatus, incrementStatusCount };
