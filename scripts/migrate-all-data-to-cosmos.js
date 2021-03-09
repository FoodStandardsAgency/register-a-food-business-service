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
  getAllRegistrationRNs,
  getRegistrationByFsaRn
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
let missingRecords = [];
let failedRecords = [];
let insertedRecords = [];

const migrateMissingRecordsToCosmos = async () => {
  await connectToDb();
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  //Find all FSA-RN from each database.
  const cosmosRecords = await beCache
    .find({}, { projection: { _id: 0, "fsa-rn": 1 } })
    .toArray();
  const cosmosRecordNumbers = cosmosRecords.map((rec) => {
    return rec["fsa-rn"];
  });

  await connectToDb();
  const pgRegistrations = await getAllRegistrationRNs();
  const pgRegistrationNumbers = pgRegistrations.map((reg) => {
    return reg.dataValues["fsa_rn"];
  });

  // Find records that aren't in PG (test records).
  missingRecords = pgRegistrationNumbers.filter((record) => {
    return cosmosRecordNumbers.indexOf(record) < 0;
  });

  logEmitter.emit(
    "info",
    `Missing records from cosmos: ${missingRecords.length} - ${missingRecords}`
  );

  // Insert missing records in batches until all have been attempted
  while (missingRecords.length > 0) {
    const promises = missingRecords.slice(0, 50).map(async (reg) => {
      await insertCosmosRecord(reg);
      missingRecords = missingRecords.filter((rec) => {
        return rec !== reg;
      });
    });
    await Promise.allSettled(promises);
  }

  logEmitter.emit(
    "info",
    `Successfully inserted ${insertedRecords.length} Postgres registrations inserted into Cosmos: ${insertedRecords}`
  );
  logEmitter.emit(
    "info",
    `Failed to insert ${failedRecords.length} Postgres registrations into Cosmos: ${failedRecords}`
  );
};

const insertCosmosRecord = async (fsaRn) => {
  try {
    const reg = await getRegistrationByFsaRn(fsaRn);
    const {
      fsa_rn,
      collected,
      collected_at,
      createdAt,
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
        declaration: cleanRecord(declaration.dataValues)
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
