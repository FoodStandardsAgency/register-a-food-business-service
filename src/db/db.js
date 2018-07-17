const Sequelize = require("sequelize");
const { info } = require("winston");
const createEstablishment = require("./models/Establishment");

const connectionString = `postgres://${process.env.POSTGRES_USER}:${
  process.env.POSTGRES_PASS
}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}?ssl=true`;

const db = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectOptions: {
    ssl: true
  }
});

const Establishment = createEstablishment(db, Sequelize);

db.authenticate()
  .then(() => {
    info("Connection to postgres db has been established successfully.");
  })
  .catch(err => {
    info("Unable to connect to the database:", err);
  });

module.exports = { Establishment };
