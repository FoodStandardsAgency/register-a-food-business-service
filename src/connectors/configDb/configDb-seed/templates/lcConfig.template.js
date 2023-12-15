const localCouncilTemplate = (seedData, env) => ({
  _id: Number(seedData.SEED_LC_ID),
  local_council: seedData.SEED_LC_NAME,
  local_council_email:
    env === "production" ? seedData.SEED_LC_EMAIL : "fsatestemail.valid@gmail.com",
  local_council_notify_emails:
    env === "production" ? [seedData.SEED_LC_NOTIFY_EMAIL] : ["fsatestemail.valid@gmail.com"],
  local_council_phone_number: env === "production" ? seedData.SEED_LC_PHONE_NUMBER : "01234 567890",
  local_council_url: seedData.SEED_LC_URL,
  auth: null
});

module.exports = localCouncilTemplate;
