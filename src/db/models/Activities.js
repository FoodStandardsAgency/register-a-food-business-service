const activities = (db, Sequelize) => {
  return db.define("activities", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_type: { type: Sequelize.STRING },
    business_type: { type: Sequelize.STRING },
    business_type_search_term: { type: Sequelize.STRING },
    import_export_activities: { type: Sequelize.STRING },
    opening_day_monday: { type: Sequelize.BOOLEAN },
    opening_day_tuesay: { type: Sequelize.BOOLEAN },
    opening_day_wednesday: { type: Sequelize.BOOLEAN },
    opening_day_thursday: { type: Sequelize.BOOLEAN },
    opening_day_friday: { type: Sequelize.BOOLEAN },
    opening_day_saturday: { type: Sequelize.BOOLEAN },
    opening_day_sunday: { type: Sequelize.BOOLEAN },
    opening_days_irregular: { type: Sequelize.STRING }
  });
};

module.exports = { activities };
