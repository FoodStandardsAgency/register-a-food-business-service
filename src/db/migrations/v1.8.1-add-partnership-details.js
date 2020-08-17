"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      { tableName: "partners", schema: "registrations" },
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        },
        partner_name: {
          type: Sequelize.STRING
        },
        partner_is_primary_contact: {
          type: Sequelize.BOOLEAN
        },
        operatorId: {
          type: Sequelize.INTEGER,
          references: {
            model: { tableName: "operators", schema: "registrations" },
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: "partners",
      schema: "registrations"
    });
  }
};
