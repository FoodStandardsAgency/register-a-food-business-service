const {
  getStoredStatus,
  updateStoredStatus,
  getEmailDistribution
} = require("../connectors/status/status-db.connector");

const { NOTIFY_STATUS_TEMPLATE, ENVIRONMENT_DESCRIPTION} = require("../config");

const { sendSingleEmail } = require("../connectors/notify/notify.connector");

const getStatus = async statusName => {
  const status = await getStoredStatus();
  return statusName ? status[statusName] : status;
};

const setStatus = async (statusName, newStatus) => {
  const status = await getStoredStatus();
  const currentValue = status[statusName];
  const updatedStatusValue = await updateStoredStatus(statusName, newStatus);

  if(newStatus !== currentValue) {
    let statusText = "Invalid";
    if(newStatus === true) {
      statusText = "Succeeded";
    } else if(newStatus === false) {
      statusText = "Failed";
    }
    statusName = statusName.replace('Succeeded','').replace('mostRecent','').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    const data = {
        environment_description: ENVIRONMENT_DESCRIPTION,
        status_name: statusName.charAt(0).toUpperCase() + statusName.slice(1),
        status_value: statusText,
        time: new Date().toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London'})
    };
    
    const emailList = await getEmailDistribution();

    emailList.forEach(function (item) {
      try {
        sendSingleEmail(NOTIFY_STATUS_TEMPLATE, item, data);
      } catch (err) {
      };
    });
    
  }

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
