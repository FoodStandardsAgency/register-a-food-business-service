const Sequelize = require("sequelize");
const { info } = require("winston");
const {
  activities,
  establishment,
  metadata,
  operator,
  premise,
  registration,
  setupRelationships
} = require("./models");
const {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PASS,
  POSTGRES_USER
} = require("../config");

const connectionString = `postgres://${POSTGRES_USER}:${POSTGRES_PASS}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?ssl=true`;

const db = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectOptions: {
    ssl: true
  }
});

const Activities = activities(db, Sequelize);
const Establishment = establishment(db, Sequelize);
const Metadata = metadata(db, Sequelize);
const Operator = operator(db, Sequelize);
const Premise = premise(db, Sequelize);
const Registration = registration(db, Sequelize);

setupRelationships({
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration
});

db.sync({
  force: true
});

db.authenticate()
  .then(() => {
    info("Connection to postgres db has been established successfully.");
  })
  .catch(err => {
    info("Unable to connect to the database:", err);
  });

module.exports = {
  Activities,
  Establishment,
  Metadata,
  Operator,
  Premise,
  Registration
};
