require("dotenv").config();
const {
  establishConnectionToCosmos,
  closeCosmosConnection
} = require("../src/connectors/cosmos.client");
const { logEmitter } = require("../src/services/logging.service");

let beCache;
let registrations = [];
let recordsFailedToAnonymise = [];
let recordsModifiedCount = 0;

const anonymiseData = async () => {
  try {
    beCache = await establishConnectionToCosmos(
      "registrations",
      "registrations"
    );

    registrations = await beCache.find({}).toArray();

    logEmitter.emit("info", "Anonymising data in cosmos...");

    while (registrations.length > 0) {
      const promises = registrations.slice(0, 10).map(async (reg) => {
        registrations = registrations.filter((rec) => {
          return rec !== reg;
        });
        await anonymiseFields(reg);
      });
      await Promise.allSettled(promises);
    }
    logEmitter.emit("info", `Anonymised ${recordsModifiedCount} records`);
    logEmitter.emit(
      "info",
      `Failed to anonymise ${recordsFailedToAnonymise.length} records - ${recordsFailedToAnonymise}`
    );
  } catch (err) {
    logEmitter.emit("info", `Failed to anonymise records - ${err}`);
  }
};

const anonymiseFields = async (reg) => {
  try {
    let partnerObject = {};
    if (reg.establishment.operator.partners) {
      partnerObject = setPartners(reg.establishment.operator.partners);
    }

    const setObject = Object.assign(
      {},
      reg.establishment.operator.operator_address_line_1 && {
        "establishment.operator.operator_address_line_1": `10 ${randomName(6)}`,
        "establishment.operator.operator_address_line_2": `${randomName(6)}`,
        "establishment.operator.operator_address_line_3": `${randomName(6)}`,
        "establishment.operator.operator_town": `${randomName(6)}`,
        "establishment.operator.operator_postcode": `${randomPostcode()}`
      },
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

    const result = await beCache.updateOne(
      { "fsa-rn": reg["fsa-rn"] },
      {
        $set: setObject
      }
    );
    recordsModifiedCount += result.modifiedCount;
  } catch (err) {
    recordsFailedToAnonymise.push(reg["fsa-rn"]);
    logEmitter.emit(
      "info",
      `Failed to anonymise FSA-RN: ${reg["fsa-rn"]} - ${err.message}`
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

const randomPostcode = () => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < 7; i++) {
    result +=
      i === 2 || i === 4
        ? `${Math.floor(Math.random() * 9)}`
        : i === 3
        ? " "
        : characters.charAt(Math.floor(Math.random() * charactersLength));
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
    logEmitter.emit("info", "Successfully finished anonymise script");
  })
  .catch((err) => {
    logEmitter.emit("info", `Failed to run anonymise script: ${err.message}`);
  });
