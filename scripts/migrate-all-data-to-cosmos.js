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

const migrateMissingRecordsToCosmos = async () => {
  try {
    missingRecords = await findMissingRecords();

    logEmitter.emit(
      "info",
      `Records missing from cosmos: ${missingRecords.length} - ${missingRecords}`
    );
    // Insert missing records in batches until all have been attempted
    while (missingRecords.length > 0) {
      const promises = missingRecords.slice(0, 50).map(async (reg) => {
        missingRecords = missingRecords.filter((rec) => {
          return rec !== reg;
        });
        const response = await insertCosmosRecord(reg);
        logEmitter.emit(
          "info",
          `Insert record response - ${JSON.stringify(response)}`
        );
      });
      await Promise.allSettled(promises);
    }
    const remainingMissingRecords = await findMissingRecords();
    logEmitter.emit(
      "info",
      `Records still missing from cosmos: ${remainingMissingRecords.length} - ${remainingMissingRecords}`
    );
  } catch (err) {
    logEmitter.emit("info", `Insert missing records to cosmos failed - ${err}`);
  }
};

const findMissingRecords = async () => {
  try {
    await connectToDb();
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );

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
    recordsMissing = pgRegistrationNumbers.filter((record) => {
      return cosmosRecordNumbers.indexOf(record) < 0;
    });

    return recordsMissing;
  } catch (err) {
    logEmitter.emit("info", `findMissingRecords failed - ${err}`);
  }
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

    const repsonse = await beCache.insertOne(completeCacheRecord);
    return repsonse.result;
  } catch (err) {
    logEmitter.emit("info", `Failed to insert record - ${err}`);
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
  .catch((err) => {
    closeCosmosConnection();
    closeConnection();
    logEmitter.emit(`info", "Failed to run migrate to cosmos script - ${err}`);
  });
