const registration = (db, Sequelize) => {
  return db.define("registration", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fsa_rn: {
      type: Sequelize.STRING
    }
  });
};

module.exports = { registration };
