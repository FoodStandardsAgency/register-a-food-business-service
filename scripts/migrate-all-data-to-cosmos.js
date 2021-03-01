require("dotenv").config();
const { connectToDb, closeConnection } = require("../src/db/db");
const { logEmitter } = require("../src/services/logging.service");
const {
  getEstablishmentByRegId,
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getActivitiesByEstablishmentId,
  getDeclarationByRegId,
  getAllPartnersByOperatorId,
  getAllRegistrations
} = require("../src/connectors/registrationDb/registrationDb");
const {
  getLcContactConfig
} = require("../src/api/registration/registration.service");
const {
  findCouncilByUrl
} = require("../src/connectors/configDb/configDb.connector");
const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");

let beCache;
let insertedRecords = [];
let failedRecords = [];

const migrateMissingRecordsToCosmos = async () => {
  await connectToDb();
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  await getAllRegistrations().then(async (regs) => {
    const promises = regs.map(async (reg) => {
      const record = await beCache.findOne(
        { "fsa-rn": reg.dataValues.fsa_rn },
        { projection: { _id: 0, "fsa-rn": 1 } }
      );

      if (!record) {
        await insertCosmosRecord(reg); // update migration status
      }
    });
    await Promise.allSettled(promises);
  });
  logEmitter.emit(
    "info",
    `Successfully inserted ${insertedRecords.length} Postgres registrations inserted into Cosmos: ${insertedRecords}`
  );
  logEmitter.emit(
    "info",
    `Failed to insert ${failedRecords.length} Postgres registrations into Cosmos: ${failedRecords}`
  );
};

const insertCosmosRecord = async (reg) => {
  logEmitter.emit(
    "info",
    `Inserting PG Registration ID: ${reg.dataValues.fsa_rn} into BE Cache`
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

    const establishment = await getEstablishmentByRegId(reg.dataValues.id);
    const operator = await getOperatorByEstablishmentId(
      establishment.dataValues.id
    );
    const partners = await getAllPartnersByOperatorId(operator.dataValues.id);
    const premise = await getPremiseByEstablishmentId(
      establishment.dataValues.id
    );
    const activities = await getActivitiesByEstablishmentId(
      establishment.dataValues.id
    );
    const declaration = await getDeclarationByRegId(reg.dataValues.id);

    const lcConfigCollection = await establishConnectionToCosmos(
      "config",
      "localAuthorities"
    );
    const hygieneAndStandards = await getLcContactConfig(
      reg.dataValues.council
    );
    const { _id } = await findCouncilByUrl(
      lcConfigCollection,
      reg.dataValues.council
    );

    const notifications = [
      {
        time: createdAt,
        sent: true,
        type: "LC",
        address: hygieneAndStandards.hygiene
          ? hygieneAndStandards.hygiene.local_council_notify_emails
          : hygieneAndStandards.hygieneAndStandards.local_council.notify_emails
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
    ];

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
          establishment_details: cleanRecord(establishment.dataValues),
          operator: Object.assign(
            {},
            cleanRecord(operator.dataValues),
            partners[0] && {
              partners: partners.map((partner) => {
                return partner.dataValues;
              })
            }
          ),
          premise: cleanRecord(premise.dataValues),
          activities: cleanRecord(activities.dataValues)
        },
        metadata: cleanRecord(declaration.dataValues)
      },
      hygieneAndStandards,
      { status: { notifications: notifications.flat() } },
      {
        hygiene_council_code: _id,
        local_council_url: reg.dataValues.council,
        source_council_id: _id,
        registration_data_version: "2.0.1"
      }
    );
    delete completeCacheRecord.establishment.establishment_details.id;
    delete completeCacheRecord.establishment.operator.id;

    await beCache.insertOne(completeCacheRecord);
    insertedRecords.push(reg.dataValues.fsa_rn);
  } catch (err) {
    failedRecords.push(reg.dataValues.fsa_rn);
    logEmitter.emit(
      "info",
      `Failed inserting PG Registration ID: ${reg.dataValues.fsa_rn} into BE Cache ${err.message}`
    );
    // Add migration status to PG
    //Might need to change to upsert as some older mongo db records don't have all of these fields
  }
};
//Remove null value fields
const cleanRecord = (record) => {
  return Object.fromEntries(
    Object.entries(record).filter(([key, value]) => value != null)
  );
};

migrateMissingRecordsToCosmos()
  .then(() => {
    closeCosmosConnection();
    closeConnection();
    logEmitter.emit("info", "Successfully finished migrate to cosmos script");
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run migrate to cosmos script");
  });
