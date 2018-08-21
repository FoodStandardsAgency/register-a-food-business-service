const { FRONT_END_NAME, FRONT_END_SECRET } = require("../config");

const authHandler = (req, res, next) => {
  const secrets = {
    [FRONT_END_NAME]: FRONT_END_SECRET
  };
  const clientSecret = req.headers["api-secret"];
  const client = req.headers["client-name"];

  // Check that clientSecret is provided
  if (!clientSecret) {
    const err = new Error("Client secret not found");
    err.name = "clientSecretNotFound";
    throw err;
  }

  // Check that client is provided
  if (!client) {
    const err = new Error("Client not found");
    err.name = "clientNotFound";
    throw err;
  }
  const secret = secrets[client];

  // Check that client is supported
  if (!secret) {
    const err = new Error("Client not supported");
    err.name = "clientNotSupported";
    throw err;
  }

  // Verify secret
  if (secret !== clientSecret) {
    const err = new Error("Secret invalid");
    err.name = "secretInvalid";
    throw err;
  }

  next();
};

module.exports = { authHandler };
