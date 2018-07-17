require("dotenv").config();

module.exports = {
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASS: process.env.POSTGRES_PASS,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_DB: process.env.POSTGRES_DB
};
