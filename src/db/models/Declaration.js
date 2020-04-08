module.exports = (sequelize, DataTypes) => {
  const Declaration = sequelize.define(
    "declaration",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      declaration1: { type: DataTypes.STRING },
      declaration2: { type: DataTypes.STRING },
      declaration3: { type: DataTypes.STRING },
      feedback1: { type: DataTypes.STRING },
    },
    {}
  );
  Declaration.associate = function (models) {
    Declaration.belongsTo(models.registration);
  };
  return Declaration;
};
