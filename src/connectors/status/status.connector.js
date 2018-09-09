const storedStatus = {
  example: "value"
};

const getStoredStatus = async () => storedStatus;

const updateStoredStatus = async (statusName, newStatus) => {
  storedStatus[statusName] = newStatus;
  return storedStatus[statusName];
};

module.exports = { getStoredStatus, updateStoredStatus };
