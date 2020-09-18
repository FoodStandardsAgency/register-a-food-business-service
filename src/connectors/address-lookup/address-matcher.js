const { getAddressesByPostcode } = require("./address-lookup-api.connector");
const { logEmitter } = require("../../services/logging.service");

/**
 * Attempt to match address to get the URPN
 *
 * @param {string} first_line The address first line to match
 *
 * @param {string} postcode The address postcode to match
 *
 * @returns {string} The UPRN, or null if unmatched
 */
const getUprn = async (first_line, postcode) => {
  logEmitter.emit("functionCallWith", "address-matcher", "getUprn", postcode);
  let uprn = null;

  try {
    const addressLookupResponse = await getAddressesByPostcode(postcode);

    // Try to match returned addresses against provided first line
    for (var i = 0; i < addressLookupResponse.length; i++) {
      const address = addressLookupResponse[i];
      if (address["addressline1"].toLowerCase() == first_line.toLowerCase()) {
        uprn = address["uprn"];
        logEmitter.emit("info", `UPRN found ${uprn}`);
      }
    }

    logEmitter.emit("functionSuccess", "address-matcher", "getUprn");
  } catch (err) {
    logEmitter.emit("functionFail", "address-matcher", "getUprn", err);
  }
  return uprn;
};

module.exports = { getUprn };
