require("dotenv").config();

module.exports = {
  NOTIFY_KEY: process.env.NOTIFY_KEY,
  NOTIFY_TEMPLATE_ID_TEST: process.env.NOTIFY_TEMPLATE_ID_TEST,
  FRONT_END_NAME: process.env.FRONT_END_NAME,
  FRONT_END_SECRET: process.env.FRONT_END_SECRET,
  DIRECT_API_NAME: process.env.DIRECT_API_NAME,
  DIRECT_API_SECRET: process.env.DIRECT_API_SECRET,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  COSMOSDB_URL: process.env.COSMOSDB_URL,
  NOTIFY_STATUS_TEMPLATE: process.env.NOTIFY_STATUS_TEMPLATE,
  ENVIRONMENT_DESCRIPTION: process.env.ENVIRONMENT_DESCRIPTION,
  ADDRESS_API_URL_BASE: `https://ws.postcoder.com/pcw/${
    process.env.ADDRESS_API_KEY || "PCW45-12345-12345-1234X"
  }/pafaddressbase`,
  ADDRESS_API_URL_QUERY:
    "format=json&lines=3&addtags=uprn&exclude=organisation",
  ADDRESS_API_URL_BASE_STANDARD: `https://ws.postcoder.com/pcw/${
    process.env.ADDRESS_API_KEY || "PCW45-12345-12345-1234X"
  }/address`,
  ADDRESS_API_URL_QUERY_STANDARD: "format=json&lines=3"
};
