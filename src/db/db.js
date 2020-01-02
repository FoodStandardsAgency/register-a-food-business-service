const { info } = require("winston");
const db = require("./models");

const connectToDb = async () => {
  try {
    await db.sequelize.authenticate();
    info("Connection to postgres db has been established successfully.");
  } catch (err) {
    info(`Unable to connect to the database: ${err}`);
  }
};

const closeConnection = async () => {
  return db.sequelize.close();
};
module.exports = {
  Activities: db.activities,
  Establishment: db.establishment,
  Metadata: db.metadata,
  Operator: db.operator,
  Premise: db.premise,
  Registration: db.registration,
  Partner: db.partner,
  Council: db.council,
  connectToDb,
  closeConnection
};
