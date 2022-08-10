const regularIntegrationResponse = require("./regularIntegrationResponse.json");

const addressLookupDouble = (postcode) => {
  if (postcode === "BS249ST") {
    return { data: regularIntegrationResponse, status: 200 };
  } else if (postcode === "AA111AA") {
    return { data: [], status: 200 };
  } else {
    return { status: 500 };
  }
};

module.exports = { addressLookupDouble };
