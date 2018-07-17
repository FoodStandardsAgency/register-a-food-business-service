const Sequelize = require("sequelize");

//postgres://{your_username}:{your_password}@{host_name}:5432/{your_database}?ssl=true
const connectionString = `postgres://${process.env.POSTGRES_USER}:${
  process.env.POSTGRES_PASS
}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}?ssl=true`;

const db = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectOptions: {
    ssl: true
  }
});

db.authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = db;
