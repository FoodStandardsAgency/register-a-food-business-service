require("dotenv").config();

module.exports = {
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASS: process.env.POSTGRES_PASS,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_DB: process.env.POSTGRES_DB,
  NOTIFY_TEMPLATE_ID_FBO:
    process.env.NOTIFY_TEMPLATE_ID_FBO ||
    "a23a8e80-9a63-4140-ad27-3cec68489fd0",
  NOTIFY_TEMPLATE_ID_LC:
    process.env.NOTIFY_TEMPLATE_ID_LC || "ecd52876-d5b0-41a0-af2b-7ac220f96625",
  NOTIFY_TEMPLATE_ID_TEST:
    process.env.NOTIFY_TEMPLATE_ID_TEST ||
    "e1465fad-9f95-475a-9e38-0603d1341e8c"
};
