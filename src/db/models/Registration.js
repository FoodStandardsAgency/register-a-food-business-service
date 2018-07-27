const registration = (db, Sequelize) => {
  return db.define("registration", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  });
};

module.exports = { registration };
