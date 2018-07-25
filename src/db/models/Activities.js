const activities = (db, Sequelize) => {
  return db.define("activities", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_type: { type: Sequelize.STRING }
  });
};

module.exports = { activities };
