const localCouncilTemplate = (seedData, env) => ({
  _id: Number(seedData.SEED_LC_ID),
  local_council: seedData.SEED_LC_NAME,
  local_council_email:
    env === "production"
      ? seedData.SEED_LC_EMAIL
      : "fsatestemail.valid@gmail.com",
  local_council_notify_emails:
    env === "production"
      ? [seedData.SEED_LC_NOTIFY_EMAIL]
      : ["fsatestemail.valid@gmail.com"],
  local_council_phone_number:
    env === "production" ? seedData.SEED_LC_PHONE_NUMBER : "01234 567890",
  local_council_url: seedData.SEED_LC_URL,
  auth:
    seedData.SEED_TASCOMI_PUBLIC_KEY_LC && seedData.SEED_TASCOMI_PRIVATE_KEY_LC
      ? {
          url:
            env === "production"
              ? seedData.SEED_TASCOMI_URL_LC
              : seedData.SEED_TASCOMI_URL_DEV,
          public_key:
            env === "production"
              ? seedData.SEED_TASCOMI_PUBLIC_KEY_LC
              : seedData.SEED_TASCOMI_PUBLIC_KEY_DEV,
          private_key:
            env === "production"
              ? seedData.SEED_TASCOMI_PRIVATE_KEY_LC
              : seedData.SEED_TASCOMI_PRIVATE_KEY_DEV
        }
      : null
});

module.exports = localCouncilTemplate;
