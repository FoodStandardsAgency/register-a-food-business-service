"use strict";

/**
 * Builds a multi-line display address for the establishment premises, skipping empty parts.
 * Always returns a string: Notify rejects a request with a missing personalisation key,
 * so an absent address becomes an empty string rather than undefined.
 *
 * @param {Object} establishment - The registration's establishment object.
 *
 * @returns {string} Address parts separated by newlines.
 */
const getEstablishmentAddress = (establishment) => {
  const premise = (establishment && establishment.premise) || {};
  return [
    premise.establishment_address_line_1,
    premise.establishment_address_line_2,
    premise.establishment_address_line_3,
    premise.establishment_town,
    premise.establishment_postcode
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join("\n");
};

module.exports = { getEstablishmentAddress };
