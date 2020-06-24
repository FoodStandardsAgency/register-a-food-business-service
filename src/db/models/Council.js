module.exports = (sequelize, DataTypes) => {
  const Council = sequelize.define(
    "council",
    {
        local_council_id: {type: DataTypes.INTEGER},
        // eventually use the local_council_id as the primary key
        local_council_url: { type: DataTypes.STRING, primaryKey: true },
        competent_authority_id: { type: DataTypes.INTEGER },
        local_council_full_name: { type: DataTypes.STRING },
        local_council: { type: DataTypes.STRING },
        local_council_phone_number: { type: DataTypes.STRING },
        country: { type: DataTypes.STRING },
        separate_standards_council: { type: DataTypes.INTEGER },

        local_council_notify_emails: { type: DataTypes.JSONB },
        auth: { type: DataTypes.JSONB },

        _id: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.local_council_id;
            },
            set(value) {
                throw new Error('Do not try to set the `_id` value!');
            }
        }
    },
    {}
  );
  return Council;
};
