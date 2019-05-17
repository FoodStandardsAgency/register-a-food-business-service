module.exports = {
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: true
    },
    keepAlive: true,
    logging: false
  },
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: true
    }
  },
  local: {
    username: "postgres",
    password: process.env.PASS,
    database: "postgres",
    host: "localhost",
    dialect: "postgres"
  }
};
