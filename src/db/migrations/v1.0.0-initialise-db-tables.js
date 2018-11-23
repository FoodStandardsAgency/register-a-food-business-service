"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.createTable("registrations", {
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
        }
      }),
      queryInterface.createTable("establishments", {
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
        registrationId: {
          type: Sequelize.INTEGER,
          references: {
            model: "registrations",
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      }),
      queryInterface.createTable("activities", {
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
        establishmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: "establishments",
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      }),
      queryInterface.createTable("metadata", {
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
        registrationId: {
          type: Sequelize.INTEGER,
          references: {
            model: "registrations",
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      }),
      queryInterface.createTable("operators", {
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
        establishmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: "establishments",
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      }),
      queryInterface.createTable("premises", {
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
        establishmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: "establishments",
            key: "id"
          },
          onUpdate: "cascade",
          onDelete: "cascade"
        }
      })
    ];
  },
  down: queryInterface => {
    return [
      queryInterface.dropTable("activities"),
      queryInterface.dropTable("establishments"),
      queryInterface.dropTable("metadata"),
      queryInterface.dropTable("operators"),
      queryInterface.dropTable("premises"),
      queryInterface.dropTable("registrations")
    ];
  }
};
