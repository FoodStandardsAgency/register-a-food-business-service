const activities = (db, Sequelize) => {
  return db.define("activities", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_type: { type: Sequelize.STRING },
    business_type: { type: Sequelize.STRING },
    business_type_search_term: { type: Sequelize.STRING }
  });
};

module.exports = { activities };
