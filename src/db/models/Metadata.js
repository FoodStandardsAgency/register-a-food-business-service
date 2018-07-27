const metadata = (db, Sequelize) => {
  return db.define("metadata", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    declaration1: { type: Sequelize.STRING },
    declaration2: { type: Sequelize.STRING },
    declaration3: { type: Sequelize.STRING }
  });
};

module.exports = { metadata };
