module.exports = env => ({
  _id: Number(process.env.SEED_LC_ID),
  local_council: process.env.SEED_LC_NAME,
  local_council_email:
    env === "production"
      ? process.env.SEED_LC_EMAIL
      : "fsatestemail.valid@gmail.com",
  local_council_notify_emails:
    env === "production"
      ? [process.env.SEED_LC_NOTIFY_EMAIL]
      : ["fsatestemail.valid@gmail.com"],
  local_council_phone_number:
    env === "production" ? process.env.SEED_LC_PHONE_NUMBER : "01234 567890",
  local_council_url: process.env.SEED_LC_URL,
  auth: {
    url:
      env === "production"
        ? process.env.SEED_TASCOMI_URL_LC
        : process.env.SEED_TASCOMI_URL_DEV,
    public_key:
      env === "production"
        ? process.env.SEED_TASCOMI_PUBLIC_KEY_LC
        : process.env.SEED_TASCOMI_PUBLIC_KEY_DEV,
    private_key:
      env === "production"
        ? process.env.SEED_TASCOMI_PRIVATE_KEY_LC
        : process.env.SEED_TASCOMI_PRIVATE_KEY_DEV
  }
});
