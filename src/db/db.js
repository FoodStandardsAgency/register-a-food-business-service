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
  return await db.sequelize.close();
};
module.exports = {
  Activities: db.activities,
  Establishment: db.establishment,
  Declaration: db.declaration,
  Operator: db.operator,
  Premise: db.premise,
  Registration: db.registration,
  Partner: db.partner,
  Council: db.council,
  connectToDb,
  closeConnection,
};
