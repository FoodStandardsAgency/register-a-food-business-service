require("dotenv").config();

module.exports = {
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASS: process.env.POSTGRES_PASS,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_DB: process.env.POSTGRES_DB,
  NOTIFY_KEY: process.env.NOTIFY_KEY,
  NOTIFY_TEMPLATE_ID_TEST: process.env.NOTIFY_TEMPLATE_ID_TEST,
  FRONT_END_NAME: process.env.FRONT_END_NAME,
  FRONT_END_SECRET: process.env.FRONT_END_SECRET,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  CONFIGDB_URL: process.env.CONFIGDB_URL,
  CACHEDB_URL: process.env.CACHEDB_URL,
  STATUSDB_URL: process.env.STATUSDB_URL
};
