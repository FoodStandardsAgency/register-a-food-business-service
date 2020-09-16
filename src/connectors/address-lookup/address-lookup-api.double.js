const regularIntegrationResponse = require("./regularIntegrationResponse.json");

const addressLookupDouble = (postcode) => {
  if (postcode === "BS249ST") {
    return { json: () => regularIntegrationResponse, status: 200 };
  } else if (postcode === "AA111AA") {
    return { json: () => [], status: 200 };
  } else return { status: 500 };
};

module.exports = { addressLookupDouble };
