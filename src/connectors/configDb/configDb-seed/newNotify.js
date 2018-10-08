module.exports = () => ({
  _id: process.env.SEED_DATA_VERSION_NOTIFY,
  notify_template_keys: {
    fbo_submission_complete: process.env.SEED_NOTIFY_TEMPLATE_FBO,
    lc_new_registration: process.env.SEED_NOTIFY_TEMPLATE_LC
  }
});
