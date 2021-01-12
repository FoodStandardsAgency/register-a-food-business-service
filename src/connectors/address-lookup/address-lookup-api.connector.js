/**
 * @module connectors/address-lookup-api
 */

const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const {
  ADDRESS_API_URL_BASE,
  ADDRESS_API_URL_QUERY,
  ADDRESS_API_URL_BASE_STANDARD,
  ADDRESS_API_URL_QUERY_STANDARD
} = require("../../config");
const { logEmitter } = require("../../services/logging.service");
const { addressLookupDouble } = require("./address-lookup-api.double");

/**
 * Fetches addresses from the address lookup API for the given postcode
 *
 * @param {string} postcode The postcode to search by
 *
 * @returns {array} A list of addresses
 */
const getAddressesByPostcode = async (postcode) => {
  logEmitter.emit(
    "functionCallWith",
    "address-lookup-api.connector",
    "getAddressByPostcode",
    postcode
  );

  const DOUBLE_MODE = process.env.DOUBLE_MODE;

  let firstJson;
  if (DOUBLE_MODE === "true") {
    const firstRes = addressLookupDouble(postcode);
    if (firstRes.status === 200) {
      firstJson = firstRes.json();
    } else {
      logEmitter.emit(
        "functionFail",
        "address-lookup-api.connector",
        "getAddressesByPostcode",
        `Address lookup API responded with non-200 status: ${firstRes.status}`
      );
      throw new Error(
        `Address lookup API responded with non-200 status: ${firstRes.status}`
      );
    }
  } else {
    firstJson = await fetchUsingPostcoderPremium(postcode);
    if (!firstJson || firstJson.length === 0) {
      firstJson = await fetchUsingPostcoderStandard(postcode);
    }
  }

  logEmitter.emit(
    "functionSuccess",
    "address-lookup-api.connector",
    "getAddressByPostcode"
  );
  return firstJson;
};

/**
 * Fetches addresses using Postcoder Premium service
 *
 * @param {string} postcode The postcode to search by
 *
 * @returns {object} API response object
 */
const fetchUsingPostcoderPremium = async (postcode) => {
  logEmitter.emit(
    "functionCall",
    "address-lookup-api.connector",
    "fetchUsingPostcoderPremium",
    postcode
  );

  const options = { method: "GET" };
  if (process.env.HTTP_PROXY) {
    options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }
  const response = await fetch(
    `${ADDRESS_API_URL_BASE}/${postcode}?${ADDRESS_API_URL_QUERY}`,
    options
  );

  if (response.status === 200) {
    return response.json();
  } else {
    logEmitter.emit(
      "functionFail",
      "address-lookup-api.connector",
      "fetchUsingPostcoderPremium",
      `Address lookup API responded with non-200 status: ${response.status} - ${response.statusText}`
    );
  }
};

/**
 * Fetches addresses using Postcoder Standard service
 *
 * @param {string} postcode The postcode to search by
 *
 * @returns {object} API response object
 */
const fetchUsingPostcoderStandard = async (postcode) => {
  logEmitter.emit(
    "functionCall",
    "address-lookup-api.connector",
    "fetchUsingPostcoderStandard",
    postcode
  );
  const options = { method: "GET" };
  if (process.env.HTTP_PROXY) {
    options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  const response = await fetch(
    `${ADDRESS_API_URL_BASE_STANDARD}/uk/${postcode}?${ADDRESS_API_URL_QUERY_STANDARD}`,
    options
  );
  if (response.status === 200) {
    return response.json();
  } else {
    logEmitter.emit(
      "functionFail",
      "address-lookup-api.connector",
      "fetchUsingPostcoderStandard",
      `Address lookup API responded with non-200 status: ${response.status} - ${response.statusText}`
    );
    throw new Error(
      `Address lookup API responded with non-200 status: ${response.status}`
    );
  }
};

module.exports = { getAddressesByPostcode };
