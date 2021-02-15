require("dotenv").config();
const connectToDb = require("../src/db/db");
const { logEmitter } = require("../src/services/logging.service");
const {
  getEstablishmentByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId,
  getDeclarationByRegId
} = require("../src/connectors/registrationDb/registrationDb");
const {
  getLcContactConfig
} = require("../src/api/registration/registration.service");
const {
  findCouncilByUrl,
  establishConnectionToMongo
} = require("../src/connectors/configDb/configDb.connector");

const migrateMissingRecordsToCosmos = async (queryInterface, sequelize) => {
  await connectToDb();
  const beCache = await establishConnectionToMongo;

  await queryInterface.sequelize
    .query(`SELECT * FROM registrations."registrations"`, {
      type: queryInterface.sequelize.QueryTypes.SELECT
    })
    .then(async (regs) => {
      const promises = regs.map(async (reg) => {
        console.log(reg);
        const record = beCache.find({ "fsa-rn": reg.dataValues.fsa_rn });

        if (!record) {
          await insertCosmosRecord(reg).then(() => {
            logEmitter.emit(
              "info",
              `Successfully inserted Registration ID: ${reg.id} into BE Cache`
            );
          }); // update migration status
        }
      });
      await Promise.allSettled(promises);
    });
};

const insertCosmosRecord = async (reg) => {
  logEmitter.emit(
    "info",
    `Inserting PG Registration ID: ${reg.id} into BE Cache`
  );
  try {
    const {
      fsa_rn,
      collected,
      collected_at,
      createdAt,
      updatedAt,
      direct_submission
    } = reg.dataValues;

    const establishment = await getEstablishmentByRegId(reg.id);
    const operator = await getOperatorByEstablishmentId(establishment.id);
    const premise = await getPremiseByEstablishmentId(establishment.id);
    const activities = await getActivitiesByEstablishmentId(establishment.id);
    const declaration = await getDeclarationByRegId(reg.id);

    const lcConfigCollection = await establishConnectionToMongo("lcConfig");
    const hygieneAndStandards = await getLcContactConfig(
      reg.dataValues.council
    );
    const { _id } = await findCouncilByUrl(
      lcConfigCollection,
      reg.dataValues.council
    );

    const status = {
      notifications: [
        {
          time: createdAt,
          sent: true,
          type: "LC",
          address: hygieneAndStandards.hygiene
            ? hygieneAndStandards.hygiene.local_council_notify_emails
            : hygieneAndStandards.hygieneAndStandards.local_council
                .notify_emails
        },
        hygieneAndStandards.standards
          ? {
              time: createdAt,
              sent: true,
              type: "LC",
              address: hygieneAndStandards.standards.local_council_notify_emails
            }
          : [],
        {
          time: createdAt,
          sent: true,
          type: "FBO",
          address: operator.dataValues.operator_email
            ? operator.dataValues.operator_email
            : operator.dataValues.contact_representative_email
        },
        declaration.dataValues.feedback1
          ? [
              {
                time: createdAt,
                sent: true,
                type: "FBO_FB",
                address: operator.dataValues.operator_email
                  ? operator.dataValues.operator_email
                  : operator.dataValues.contact_representative_email
              },
              {
                time: createdAt,
                sent: true,
                type: "FD_FB",
                address: (process.env.NODE_ENV = "prod"
                  ? "FutureDelivery@food.gov.uk"
                  : "fsatestemail.valid@gmail.com")
              }
            ]
          : []
      ]
    };

    const completeCacheRecord = Object.assign(
      {},
      {
        "fsa-rn": fsa_rn,
        createdAt: createdAt,
        updatedAt: updatedAt,
        collected: collected,
        collected_at: collected_at,
        reg_submission_date: createdAt,
        direct_submission: direct_submission,
        establishment: {
          establishment_details: establishment.dataValues,
          operator: operator.dataValues,
          premise: premise.dataValues,
          activities: activities.dataValues
        },
        declaration: declaration.dataValues
      },
      hygieneAndStandards,
      { status: status },
      {
        hygiene_council_code: _id,
        local_council_url: reg.dataValues.council,
        source_council_id: _id,
        registration_data_version: "2.0.1"
      }
    );

    await beCache.insertOne(completeCacheRecord);
  } catch (err) {
    logEmitter.emit(
      "info",
      `Failed inserting PG Registration ID: ${reg.id} into BE Cache ${err.message}`
    );
    // Add migration status to PG
    //Might need to change to upsert as some older mongo db records don't have all of these fields
  }
};

module.exports = {
  migrateMissingRecordsToCosmos
};
