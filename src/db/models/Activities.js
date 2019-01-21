module.exports = (sequelize, DataTypes) => {
  const Activities = sequelize.define(
    "activities",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_type: { type: DataTypes.STRING },
      business_type: { type: DataTypes.STRING },
      business_type_search_term: { type: DataTypes.STRING },
      import_export_activities: { type: DataTypes.STRING },
      business_other_details: { type: DataTypes.STRING(1500) },
      opening_days_irregular: { type: DataTypes.STRING },
      opening_day_monday: { type: DataTypes.BOOLEAN },
      opening_day_tuesday: { type: DataTypes.BOOLEAN },
      opening_day_wednesday: { type: DataTypes.BOOLEAN },
      opening_day_thursday: { type: DataTypes.BOOLEAN },
      opening_day_friday: { type: DataTypes.BOOLEAN },
      opening_day_saturday: { type: DataTypes.BOOLEAN },
      opening_day_sunday: { type: DataTypes.BOOLEAN }
    },
    {}
  );
  Activities.associate = function(models) {
    Activities.belongsTo(models.establishment);
  };
  return Activities;
};
