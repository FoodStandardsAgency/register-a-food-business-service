module.exports = (sequelize, DataTypes) => {
  const Establishment = sequelize.define(
    "establishment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      establishment_trading_name: { type: DataTypes.STRING },
      establishment_opening_date: { type: DataTypes.STRING }
    },
    {}
  );
  Establishment.associate = function(models) {
    Establishment.belongsTo(models.registration);
  };
  return Establishment;
};
