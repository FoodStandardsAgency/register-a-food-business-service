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
  ADDRESS_API_URL_QUERY: "format=json&lines=3&addtags=uprn&exclude=organisation",
  ADDRESS_API_URL_BASE_STANDARD: `https://ws.postcoder.com/pcw/${
    process.env.ADDRESS_API_KEY || "PCW45-12345-12345-1234X"
  }/address`,
  ADDRESS_API_URL_QUERY_STANDARD: "format=json&lines=3",
  RNG_API_URL: process.env.RNG_API_URL || "https://rng.food.gov.uk",

  FBO_SUBMISSION_COMPLETE_TEMPLATE_ID:
    process.env.FBO_SUBMISSION_COMPLETE_TEMPLATE_ID || "281514ac-c813-42cd-8a26-afd6d09c72e0",
  LC_NEW_REGISTRATION_TEMPLATE_ID:
    process.env.LC_NEW_REGISTRATION_TEMPLATE_ID || "9b17b8ea-5639-435d-977e-9949f9f1e8c5",
  FBO_FEEDBACK_TEMPLATE_ID:
    process.env.FBO_FEEDBACK_TEMPLATE_ID || "e36a8f9e-c20b-4ab3-908e-3ceaaafec12a",
  FD_FEEDBACK_TEMPLATE_ID:
    process.env.FD_FEEDBACK_TEMPLATE_ID || "c58c834f-97c5-486d-a4fa-6b42edc171b7",
  RNG_PENDING_TEMPLATE_ID:
    process.env.RNG_PENDING_TEMPLATE_ID || "fae273a6-fe5d-424f-92b1-f93fadd33f3f",

  FBO_SUBMISSION_COMPLETE_TEMPLATE_ID_CY:
    process.env.FBO_SUBMISSION_COMPLETE_TEMPLATE_ID_CY || "372d9863-c988-4a2a-a658-f2fb68bb41cc",
  LC_NEW_REGISTRATION_TEMPLATE_ID_CY:
    process.env.LC_NEW_REGISTRATION_TEMPLATE_ID_CY || "5eb69c3d-20f5-4d70-9747-2e901489e8f4",
  FBO_FEEDBACK_TEMPLATE_ID_CY:
    process.env.FBO_FEEDBACK_TEMPLATE_ID_CY || "acf73014-fd4d-415c-b2dd-1aa78f6232b7",
  RNG_PENDING_TEMPLATE_ID_CY:
    process.env.RNG_PENDING_TEMPLATE_ID_CY || "8cd18222-54f1-4276-9621-86c0f9e23d0a",

  FUTURE_DELIVERY_EMAIL: process.env.FUTURE_DELIVERY_EMAIL || "fsatestemail.valid@gmail.com"
};
