const { setStatus, incrementStatusCount } = require("./status.service");
const EventEmitter = require("events");

class StatusUpdate extends EventEmitter {}

const statusEmitter = new StatusUpdate();

statusEmitter.on("incrementCount", async statusName => {
  incrementStatusCount(statusName);
});

statusEmitter.on("setStatus", async (statusName, newStatus) => {
  setStatus(statusName, newStatus);
});

module.exports = { statusEmitter };
