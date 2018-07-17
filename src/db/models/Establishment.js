module.exports = (db, Sequelize) => {
  return db.define("establishment", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true
    },
    operator_type: { type: Sequelize.STRING },
    operator_first_name: { type: Sequelize.STRING },
    operator_last_name: { type: Sequelize.STRING },
    operator_first_line: { type: Sequelize.STRING },
    operator_street: { type: Sequelize.STRING },
    operator_town: { type: Sequelize.STRING },
    operator_postcode: { type: Sequelize.STRING },
    operator_primary_number: { type: Sequelize.STRING },
    operator_secondary_number: { type: Sequelize.STRING },
    operator_email: { type: Sequelize.STRING },
    operator_company_name: { type: Sequelize.STRING },
    operator_company_house_number: { type: Sequelize.STRING },
    operator_charity_name: { type: Sequelize.STRING },
    operator_charity_number: { type: Sequelize.STRING },
    establishment_trading_name: { type: Sequelize.STRING },
    establishment_first_line: { type: Sequelize.STRING },
    establishment_street: { type: Sequelize.STRING },
    establishment_town: { type: Sequelize.STRING },
    establishment_postcode: { type: Sequelize.STRING },
    establishment_primary_number: { type: Sequelize.STRING },
    establishment_secondary_number: { type: Sequelize.STRING },
    establishment_email: { type: Sequelize.STRING },
    establishment_opening_date: { type: Sequelize.STRING },
    customer_type: { type: Sequelize.STRING },
    declaration1: { type: Sequelize.STRING },
    declaration2: { type: Sequelize.STRING },
    declaration3: { type: Sequelize.STRING }
  });
};
