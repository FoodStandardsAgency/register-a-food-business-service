const success = async (res, payload = {}) => {
  res.status(200).send(payload);

  return res;
};

const fail = async (code, res, message = null) => {
  res.status(406).send({
    error: message
  });

  return res;
};

module.exports = {
  success,
  fail
};
