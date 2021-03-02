require("dotenv").config();
const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let recordsAnonymised = [];
let recordsFailedToAnonymise = [];

const anonymiseData = async () => {
  beCache = await establishConnectionToCosmos("registrations", "registrations");

  const registrations = await beCache.find({}).toArray();

  const promises = registrations.map(async (reg) => {
    await anonymiseFields(reg);
  });

  return Promise.allSettled(promises);
};

const anonymiseFields = async (reg) => {
  try {
    let partnerObject = {};
    if (reg.establishment.operator.partners) {
      partnerObject = setPartners(reg.establishment.operator.partners);
    }

    const setObject = Object.assign(
      {},
      reg.establishment.operator.operator_first_name && {
        "establishment.operator.operator_first_name": randomName(6),
        "establishment.operator.operator_last_name": randomName(6),
        "establishment.operator.operator_email": `${randomName(8)}@mail.com`,
        "establishment.operator.operator_primary_number": randomPhoneNumber(),
        "establishment.operator.operator_secondary_number": randomPhoneNumber()
      },
      reg.establishment.operator.contact_representative_name && {
        "establishment.operator.contact_representative_name": randomName(10),
        "establishment.operator.contact_representative_email": `${randomName(
          8
        )}@mail.com`,
        "establishment.operator.contact_representative_number": randomPhoneNumber()
      },
      reg.establishment.operator.partners && {
        "establishment.operator.operator_email": `${randomName(8)}@mail.com`,
        "establishment.operator.operator_primary_number": randomPhoneNumber(),
        "establishment.operator.operator_secondary_number": randomPhoneNumber(),
        ...partnerObject
      }
    );

    await beCache.updateOne(
      { "fsa-rn": reg["fsa-rn"] },
      {
        $set: setObject
      }
    );
    recordsAnonymised.push(reg["fsa-rn"]);
  } catch (err) {
    recordsFailedToAnonymise.push(reg["fsa-rn"]);
    logEmitter.emit(
      "info",
      `Failed to anonymise BE Cache FSA-RN: ${reg["fsa-rn"]} date fields ${err.message}`
    );
  }
};

const setPartners = (partnersArray) => {
  const partnerObject = {};
  for (var i = 0; i < partnersArray.length; i++) {
    const queryString = `establishment.operator.partners.${i}.partner_name`;
    Object.assign(partnerObject, { [`${queryString}`]: randomName(6) });
  }
  return partnerObject;
};

const randomName = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

randomPhoneNumber = () => {
  result = "";
  for (var i = 0; i < 11; i++) {
    result += Math.floor(Math.random() * 9);
  }
  return result;
};

anonymiseData()
  .then(() => {
    closeCosmosConnection();
    logEmitter.emit(
      "info",
      `Successfully updated dates of ${recordsAnonymised.length} records in cosmos`
    );
    logEmitter.emit(
      "info",
      `Dates of ${recordsFailedToAnonymise.length} records failed to update in cosmos: ${recordsFailedToAnonymise}`
    );
    logEmitter.emit("info", "Successfully finished anonymise script");
  })
  .catch(() => {
    logEmitter.emit("info", "Failed to run anonymise script");
  });
