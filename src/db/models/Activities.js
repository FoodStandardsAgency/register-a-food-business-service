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
      business_other_details: { type: DataTypes.STRING },
      business_irregular_days: { type: DataTypes.STRING },
      opening_days_monday: { type: DataTypes.BOOLEAN },
      opening_days_tuesday: { type: DataTypes.BOOLEAN },
      opening_days_wednesday: { type: DataTypes.BOOLEAN },
      opening_days_thursday: { type: DataTypes.BOOLEAN },
      opening_days_friday: { type: DataTypes.BOOLEAN },
      opening_days_saturday: { type: DataTypes.BOOLEAN },
      opening_days_sunday: { type: DataTypes.BOOLEAN }
    },
    {}
  );
  Activities.associate = function(models) {
    Activities.belongsTo(models.establishment);
  };
  return Activities;
};
