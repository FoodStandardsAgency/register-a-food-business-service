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
      import_export_activities: { type: DataTypes.STRING }
    },
    {}
  );
  Activities.associate = function(models) {
    Activities.belongsTo(models.establishment);
  };
  return Activities;
};
