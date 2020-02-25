require("dotenv").config();
const mongodb = require("mongodb");
const { logEmitter } = require("../src/services/logging.service");
const {
  Registration,
  Establishment,
  Premise,
  Operator,
  connectToDb,
  closeConnection
} = require("../src/db/db");

let client;
let cacheDB;
let registrationsCollection;

const establishConnectionToMongo = async () => {
  client = await mongodb.MongoClient.connect(process.env.CACHEDB_URL, {
    useNewUrlParser: true
  });

  cacheDB = client.db("register_a_food_business_cache");

  registrationsCollection = cacheDB.collection("cachedRegistrations");
};

const getRegistrations = async () => {
  let registrations = null;
  logEmitter.emit("functionCall", "populate-addresses", "getRegistrations");

  try {
    await establishConnectionToMongo();

    registrations = await registrationsCollection
      .find({
        $and: [
          { reg_submission_date: { $gte: "2020-02-14" } },
          { reg_submission_date: { $lte: "2020-02-20" } }
        ]
      })
      .toArray();
  } catch (err) {
    logEmitter.emit(
      "functionFail",
      "populate-addresses",
      "getRegistrations",
      err
    );

    throw err;
  }

  logEmitter.emit("functionSuccess", "populate-addresses", "getRegistrations");

  return registrations;
};

const logError = (text, err) => {
  console.log(text + " (" + err + ")");
};

const populateAddresses = async transaction => {
  await connectToDb();
  const data = await getRegistrations();

  for (var i = 0, len = data.length; i < len; i++) {
    const cacheReg = data[i];
    const fsaRn = cacheReg["fsa-rn"];
    if (
      cacheReg.establishment &&
      cacheReg.establishment.operator &&
      cacheReg.establishment.premise &&
      cacheReg.establishment.operator.operator_first_line
    ) {
      let registration;
      try {
        registration = await Registration.findOne({
          where: { fsa_rn: fsaRn }
        });
        if (!registration) {
          throw "Not found";
        }
      } catch (err) {
        logError("Registration not found: " + fsaRn, err);
        continue;
      }

      let establishment;
      try {
        establishment = await Establishment.findOne({
          where: { registrationId: registration.id }
        });
        if (!establishment) {
          throw "Not found";
        }
      } catch (err) {
        logError("Establishment not found: " + fsaRn, err);
        continue;
      }

      let premise;
      try {
        premise = await Premise.findOne({
          where: { establishmentId: establishment.id }
        });
        if (!premise) {
          throw "Not found";
        }
      } catch (err) {
        logError("Premise not found: " + fsaRn, err);
        continue;
      }

      let operator;
      try {
        operator = await Operator.findOne({
          where: { establishmentId: establishment.id }
        });
        if (!operator) {
          throw "Not found";
        }
      } catch (err) {
        logError("Operator not found: " + fsaRn, err);
        continue;
      }

      if (!premise.establishment_address_line_1) {
        try {
          const update = {
            establishment_address_line_1:
              cacheReg.establishment.premise.establishment_first_line,
            establishment_address_line_2:
              cacheReg.establishment.premise.establishment_street,
            establishment_address_line_3:
              cacheReg.establishment.premise.establishment_dependent_locality
          };
          await Premise.update(update, { where: { id: premise.id } });
        } catch (err) {
          logError("Cannot update premise: " + cacheReg["fsa-rn"], err);
        }

        try {
          const update = {
            operator_address_line_2:
              cacheReg.establishment.operator.operator_street,
            operator_address_line_3:
              cacheReg.establishment.operator.operator_dependent_locality
          };
          await Operator.update(update, { where: { id: operator.id } });
        } catch (err) {
          logError("Cannot update operator: " + cacheReg["fsa-rn"], err);
        }
      }
    }
  }

  client.close();
  await closeConnection();

  logEmitter.emit("functionSuccess", "populate-addresses", "populateAddresses");
};

populateAddresses();
