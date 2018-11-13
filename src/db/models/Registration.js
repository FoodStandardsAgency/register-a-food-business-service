module.exports = (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    "registration",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fsa_rn: {
        type: DataTypes.STRING
      },
      council: {
        type: DataTypes.STRING
      },
      collected: {
        type: DataTypes.BOOLEAN
      }
    },
    {}
  );
  return Registration;
};
