const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const { logEmitter } = require("../../services/logging.service");

/**
 * Attempt to match address to get the URPN
 *
 * @param {string} firstLine The address first line to match
 *
 * @param {string} secondLine The address second line to match (only used if first line is too short)
 *
 * @param {string} postcode The address postcode to match
 *
 * @returns {string} The UPRN, or null if unmatched
 */
const getUprn = async (firstLine, secondLine, postcode) => {
  logEmitter.emit("functionCallWith", "address-matcher", "getUprn", postcode);
  let uprn = null;

  try {
    const addressLookupResponse = await getAddressesByPostcode(postcode);
    const providedAddress = transformAddressLineForMatching(firstLine, secondLine);

    if (isNumericOnly(providedAddress)) {
      return uprn;
    }

    // Try to match returned addresses against provided first line
    for (let address of addressLookupResponse) {
      const lookUpAddress = transformAddressLineForMatching(
        address["addressline1"],
        address["addressline2"]
      );

      if (linesMatch(lookUpAddress, providedAddress)) {
        uprn = address["uprn"];
        logEmitter.emit("info", `UPRN found`);
      }
    }

    logEmitter.emit("functionSuccess", "address-matcher", "getUprn");
  } catch (err) {
    logEmitter.emit("functionFail", "address-matcher", "getUprn", err);
  }
  return uprn;
};

/**
 * Transforms address lines ready for matching
 *
 * @param {string} line1 The address line 1
 *
 * @param {string} line2 The address line 2
 *
 * @returns {string} The tranformed line
 */
const transformAddressLineForMatching = (line1, line2) => {
  let transformedLine = line1.trim().toLowerCase();

  // Check if line 1 contains only digits, if so combine with line 2
  if (isNumericOnly(transformedLine)) {
    transformedLine = `${transformedLine.replace(/,/g, "")} ${(line2 || "").trim().toLowerCase()}`;
  }

  // Check if the first part of the line contains only digits (e.g. "6, Road Name"), if so combine with second part
  let lineParts = transformedLine.split(",");
  if (lineParts.length > 1 && isNumericOnly(lineParts[0])) {
    transformedLine = `${lineParts[0].trim()} ${lineParts[1].trim()}`;
  }

  return transformedLine.trim();
};

/**
 * Determines whether the line is numeric
 *
 * @param {string} line The address line
 *
 * @returns {boolean} True if line is numeric
 */
const isNumericOnly = (line) => {
  return /^[0-9,]+$/.test(line);
};

/**
 * Determines whether 2 lines match
 *
 * @param {string} address1 The first address line
 *
 * @param {string} address2 The other address line
 *
 * @returns {boolean} True if lines match
 */
const linesMatch = (address1, address2) => {
  return address1.startsWith(address2) || address2.startsWith(address1);
};

module.exports = { getUprn };
