"use strict";

const { operatorTypeEnum } = require("@slice-and-dice/register-a-food-business-validation");

/**
 * Extracts main partnership contact from partners list
 *
 * @param {Array} partners partner objects
 *
 * @returns {string} Name of main partnership contact
 */
const getMainPartnershipContactName = (partners) => {
  const mainPartnershipContact = (partners || []).find((partner) => {
    return partner.partner_is_primary_contact === true;
  });
  if (!mainPartnershipContact || !mainPartnershipContact.partner_name) {
    throw new Error("No main partnership contact found in partners list");
  }
  return mainPartnershipContact.partner_name;
};

const joinPersonalName = (firstName, lastName) =>
  firstName && lastName ? `${firstName} ${lastName}` : undefined;

/**
 * Joins all partner names into a single comma-separated display name, e.g.
 * "Alice Smith, Bob Jones" — the same style transformPartnersForNotify and
 * transformPartnersForPdf use for partnership details. The operator of a
 * partnership is the partners collectively, so the operator name lists them
 * all rather than only the main partnership contact.
 *
 * @param {Array} partners partner objects
 *
 * @returns {string} Comma-separated partner names
 */
const getPartnershipOperatorName = (partners) => {
  const names = (partners || []).map((partner) => partner.partner_name);
  if (names.length === 0 || names.some((name) => !name)) {
    throw new Error("Missing partner names in partners list");
  }
  return names.join(", ");
};

// One handler per operatorTypeEnum key. Operator types are deliberately a closed
// list: a type without a handler fails loudly in getOperatorName rather than
// rendering "undefined undefined" in emails sent to FBOs and local authorities.
const operatorNameBuilders = {
  [operatorTypeEnum.SOLETRADER.key]: (operator) =>
    joinPersonalName(operator.operator_first_name, operator.operator_last_name),
  [operatorTypeEnum.PERSON.key]: (operator) =>
    joinPersonalName(operator.operator_first_name, operator.operator_last_name),
  [operatorTypeEnum.PARTNERSHIP.key]: (operator) =>
    getPartnershipOperatorName(operator.partners),
  [operatorTypeEnum.COMPANY.key]: (operator) => operator.operator_company_name,
  [operatorTypeEnum.CHARITY.key]: (operator) => operator.operator_charity_name
};

/**
 * Builds the display name for a registration's operator based on its operator type.
 * Throws for unrecognised operator types and for missing name fields so that a bad
 * registration fails visibly instead of silently emailing "undefined undefined".
 *
 * @param {Object} operator - The establishment operator object.
 *
 * @returns {string} The operator display name.
 */
const getOperatorName = (operator) => {
  const operatorType = operator && operator.operator_type;
  const buildName = operatorNameBuilders[operatorType];
  if (!buildName) {
    throw new Error(
      `Unrecognised operator type "${operatorType}" - unable to determine operator name`
    );
  }
  const operatorName = buildName(operator);
  if (!operatorName) {
    throw new Error(`Missing operator name fields for operator type "${operatorType}"`);
  }
  return operatorName;
};

module.exports = {
  getOperatorName,
  getMainPartnershipContactName,
  getPartnershipOperatorName,
  operatorNameBuilders
};
