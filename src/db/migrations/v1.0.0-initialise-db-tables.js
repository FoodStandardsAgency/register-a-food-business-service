"use strict";

const createSchema = (queryInterface) =>
  queryInterface.createSchema("registrations");

const createRegistrations = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "registrations", schema: "registrations" },
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
      }
    }
  );

const createEstablishments = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "establishments", schema: "registrations" },
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
      registrationId: {
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: "registrations", schema: "registrations" },
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      }
    }
  );

const createMetadata = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "metadata", schema: "registrations" },
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
      registrationId: {
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: "registrations", schema: "registrations" },
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      }
    }
  );

const createActivities = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "activities", schema: "registrations" },
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
      establishmentId: {
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: "establishments", schema: "registrations" },
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      }
    }
  );

const createOperators = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "operators", schema: "registrations" },
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
      establishmentId: {
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: "establishments", schema: "registrations" },
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      }
    }
  );

const createPremises = (queryInterface, Sequelize) =>
  queryInterface.createTable(
    { tableName: "premises", schema: "registrations" },
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
      establishmentId: {
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: "establishments", schema: "registrations" },
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      }
    }
  );

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      createSchema(queryInterface).then(() => {
        createRegistrations(queryInterface, Sequelize).then(() => {
          createMetadata(queryInterface, Sequelize);
          createEstablishments(queryInterface, Sequelize).then(() => {
            createActivities(queryInterface, Sequelize);
            createOperators(queryInterface, Sequelize);
            createPremises(queryInterface, Sequelize);
          });
        });
      })
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.dropTable({
        tableName: "activities",
        schema: "registrations"
      }),
      queryInterface.dropTable({
        tableName: "establishments",
        schema: "registrations"
      }),
      queryInterface.dropTable({
        tableName: "metadata",
        schema: "registrations"
      }),
      queryInterface.dropTable({
        tableName: "operators",
        schema: "registrations"
      }),
      queryInterface.dropTable({
        tableName: "premises",
        schema: "registrations"
      }),
      queryInterface.dropTable({
        tableName: "registrations",
        schema: "registrations"
      }),
      queryInterface.dropSchema("registrations")
    ]);
  }
};
