const operator = (db, Sequelize) => {
  return db.define("operator", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    operator_type: { type: Sequelize.STRING },
    operator_company_house_number: { type: Sequelize.STRING },
    operator_charity_number: { type: Sequelize.STRING }
  });
};

module.exports = { operator };
