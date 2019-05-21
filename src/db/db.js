const { info } = require("winston");
const db = require("./models");

db.sequelize
  .authenticate()
  .then(() => {
    info("Connection to postgres db has been established successfully.");
  })
  .catch(err => {
    info("Unable to connect to the database:", err);
  });

module.exports = {
  Activities: db.activities,
  Establishment: db.establishment,
  Metadata: db.metadata,
  Operator: db.operator,
  Premise: db.premise,
  Registration: db.registration,
  Partner: db.partner
};
