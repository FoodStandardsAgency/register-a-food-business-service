const { Op } = require("sequelize");
const {
  getOperatorByEstablishmentId,
  getPremiseByEstablishmentId,
  getEstablishmentByRegId
} = require("../src/connectors/registrationDb/registrationDb");

const {
  getUkAddressesByPostcode
} = require("../../register-a-food-business-front-end/src/server/services/address.service");

const { Registration, Operator, Premise } = require("../src/db/db");

const getAllRegistrations = async () => {
  return Registration.findAll({
    where: { id: { [Op.gte]: 200, [Op.lte]: 6960 } }
  });
};

/**
 * Trims the UPRN field of any non-numeric characters (and any characters to the right of them)
 * This is to account for postcoder API returning values such as 0123456789-1
 *
 * @param {string} uprn The raw UPRN returned from postcode lookup
 *
 * @returns {string} The trimmed UPRN or an empty string if invalid, empty or not defined
 */
const trimUprn = uprn => {
  if (typeof uprn === "string" || uprn instanceof String) {
    const regEx = /^(\d+).*/;
    const match = uprn.match(regEx);
    return (match && match[1]) || "";
  }
  return "";
};

const updateOperator = async (id, address) => {
  const update = {
    operator_uprn: trimUprn(address.uprn),
    operator_address_line_1: address.addressline1,
    operator_address_line_2: address.addressline2 || null,
    operator_address_line_3: address.addressline3 || null
  };
  await Operator.update(update, { omitNull: false, where: { id: id } });
};

const updatePremise = async (id, address) => {
  const update = {
    establishment_uprn: trimUprn(address.uprn),
    establishment_address_line_1: address.addressline1,
    establishment_address_line_2: address.addressline2 || null,
    establishment_address_line_3: address.addressline3 || null
  };
  await Premise.update(update, { omitNull: false, where: { id: id } });
};

const getFullEstablishment = async id => {
  const establishment = await getEstablishmentByRegId(id);
  if (!establishment) {
    return null;
  }
  const [operator, premise] = await Promise.all([
    getOperatorByEstablishmentId(establishment.id),
    getPremiseByEstablishmentId(establishment.id)
  ]);
  return Object.assign(
    establishment.dataValues,
    { operator: operator && operator.dataValues },
    { premise: premise && premise.dataValues }
  );
};

const getAddress = async (postcode, firstLine) => {
  let addresses = [];
  addresses = await getUkAddressesByPostcode(postcode);
  const result = addresses.find(
    ({ addressline1, premise, organisation }) =>
      premise === firstLine ||
      addressline1 === firstLine ||
      organisation === firstLine
  );
  return result;
};

const updateAddressesAndUprns = async () => {
  let failedCount = 0;
  let successCount = 0;
  let failedRegistrations = [];
  console.log("start");
  const registrations = await getAllRegistrations();
  console.log("Updating " + registrations.length + " registrations");

  for (let index in registrations) {
    console.log(
      "*** processing registration : " + registrations[index].fsa_rn + " ***"
    );
    try {
      const establishment = await getFullEstablishment(registrations[index].id);
      if (!establishment) {
        throw new Error("Establishment not found in database");
      } else if (!establishment.operator) {
        throw new Error("Operator not found in database");
      } else if (
        !establishment.premise ||
        !establishment.premise.establishment_address_line_1
      ) {
        throw new Error("Premise not found in database");
      }

      let operatorAddress;
      const premiseAddress = await getAddress(
        establishment.premise.establishment_postcode,
        establishment.premise.establishment_address_line_1
      );

      // does the operator address equal the establishment address
      if (
        establishment.premise.establishment_postcode ===
          establishment.operator.operator_postcode &&
        establishment.premise.establishment_address_line_1 ===
          establishment.operator.operator_address_line_1
      ) {
        console.log("*** Matching Addresses ***");
        operatorAddress = premiseAddress;
      } else {
        console.log("*** NOT Matching Addresses ***");
        // if no then call postcoder again for operator address
        if (establishment.operator.operator_address_line_1) {
          operatorAddress = await getAddress(
            establishment.operator.operator_postcode,
            establishment.operator.operator_address_line_1
          );
        }
      }

      if (operatorAddress) {
        await updateOperator(establishment.operator.id, operatorAddress);
        console.log("Operator updated successfully");
      } else {
        console.log(
          "Registration " +
            registrations[index].fsa_rn +
            " - Operator address not found in Postcoder"
        );
      }

      if (premiseAddress) {
        await updatePremise(establishment.premise.id, premiseAddress);
        console.log("Premise updated successfully");
      } else {
        console.log(
          "Registration " +
            registrations[index].fsa_rn +
            " - Premise address not found in Postcoder"
        );
      }

      successCount++;
    } catch (err) {
      failedRegistrations.push({
        registration: registrations[index].fsa_rn,
        error: err.message
      });
      console.log(
        "Registration " + registrations[index].fsa_rn + " failed processing"
      );
      console.log("ERROR: " + err.message);
      failedCount++;
    }
  }

  console.log("Total Processed: " + registrations.length);
  console.log("Success: " + successCount);
  console.log("Failed: " + failedCount);
  console.log(failedRegistrations);
};

updateAddressesAndUprns();

module.exports = {
  updateAddressesAndUprns
};
