const { logEmitter } = require("../services/logging.service");

const mapFromCollectionsRegistration = (reg) => {
  logEmitter.emit("functionCall", "registrationMapper", "mapFromCollectionsRegistration");
  return {
    establishment: {
      establishment_details: {
        establishment_trading_name: reg.establishment.establishment_trading_name,
        establishment_additional_trading_names:
          reg.establishment.establishment_additional_trading_names,
        establishment_primary_number: reg.establishment.establishment_primary_number,
        establishment_secondary_number: reg.establishment.establishment_secondary_number,
        establishment_web_address: reg.establishment.establishment_web_address || "",
        establishment_email: reg.establishment.establishment_email,
        establishment_opening_date: reg.establishment.establishment_opening_date
      },
      operator: reg.establishment.operator,
      premise: reg.establishment.premise,
      activities: reg.establishment.activities
    },
    declaration: reg.metadata
  };
};

module.exports = { mapFromCollectionsRegistration };
