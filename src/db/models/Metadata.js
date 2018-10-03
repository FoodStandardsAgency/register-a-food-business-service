module.exports = (sequelize, DataTypes) => {
  const Metadata = sequelize.define(
    "metadata",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      declaration1: { type: DataTypes.STRING },
      declaration2: { type: DataTypes.STRING },
      declaration3: { type: DataTypes.STRING }
    },
    {}
  );
  Metadata.associate = function(models) {
    Metadata.belongsTo(models.registration);
  };
  return Metadata;
};
