const premise = (db, Sequelize) => {
  return db.define("premise", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    establishment_first_line: { type: Sequelize.STRING },
    establishment_street: { type: Sequelize.STRING },
    establishment_town: { type: Sequelize.STRING },
    establishment_postcode: { type: Sequelize.STRING },
    establishment_type: { type: Sequelize.STRING }
  });
};

module.exports = { premise };
