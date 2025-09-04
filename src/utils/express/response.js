const { logEmitter, ERROR } = require("../../services/logging.service");

const success = async (res, payload = {}) => {
  res.status(200).send(payload);

  return res;
};

const fail = async (code, res, message = null) => {
  logEmitter.emit(ERROR, message);
  res.status(code || 500).send({
    error: message
  });

  return res;
};

module.exports = {
  success,
  fail
};
