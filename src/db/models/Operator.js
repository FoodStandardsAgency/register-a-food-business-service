module.exports = (sequelize, DataTypes) => {
  const Operator = sequelize.define(
    "operator",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      operator_type: { type: DataTypes.STRING },
      operator_company_house_number: { type: DataTypes.STRING },
      operator_charity_number: { type: DataTypes.STRING }
    },
    {}
  );
  Operator.associate = function(models) {
    Operator.belongsTo(models.establishment);
  };
  return Operator;
};
