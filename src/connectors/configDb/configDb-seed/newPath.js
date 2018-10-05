module.exports = {
  _id: process.env.SEED_DATA_VERSION_PATH,
  path: {
    "/index": {
      on: true,
      switches: {}
    },
    "/registration-role": {
      on: true,
      switches: {
        "Sole trader": {
          "/operator-name": true,
          "/operator-contact-details": true
        },
        Partnership: {
          "/operator-name": true,
          "/operator-contact-details": true
        },
        Representative: {
          "/operator-type": true
        }
      }
    },
    "/operator-type": {
      on: false,
      switches: {
        "A person": {
          "/operator-name": true,
          "/operator-contact-details": true
        },
        "A company": {
          "/operator-company-details": true,
          "/contact-representative": true
        },
        "A charity": {
          "/operator-charity-details": true,
          "/contact-representative": true
        }
      }
    },
    "/operator-company-details": {
      on: false,
      switches: {}
    },
    "/operator-charity-details": {
      on: false,
      switches: {}
    },
    "/operator-name": {
      on: false,
      switches: {}
    },
    "/operator-address": {
      on: true,
      switches: {}
    },
    "/operator-address-select": {
      on: true,
      switches: {}
    },
    "/operator-address-manual": {
      on: false,
      switches: {
        operator_first_line: {
          "/operator-address-manual": true
        }
      }
    },
    "/operator-contact-details": {
      on: false,
      switches: {}
    },
    "/contact-representative": {
      on: false,
      switches: {}
    },
    "/establishment-trading-name": {
      on: true,
      switches: {}
    },
    "/establishment-address-type": {
      on: true,
      switches: {}
    },
    "/establishment-address": {
      on: true,
      switches: {}
    },
    "/establishment-address-select": {
      on: true,
      switches: {}
    },
    "/establishment-address-manual": {
      on: false,
      switches: {
        establishment_first_line: {
          "/establishment-address-manual": true
        }
      }
    },
    "/establishment-contact-details": {
      on: true,
      switches: {}
    },
    "/establishment-opening-status": {
      on: true,
      switches: {
        "Establishment is already trading": {
          "/establishment-opening-date-retroactive": true
        },
        "Establishment is not trading yet": {
          "/establishment-opening-date-proactive": true
        }
      }
    },
    "/establishment-opening-date-proactive": {
      on: false,
      switches: {}
    },
    "/establishment-opening-date-retroactive": {
      on: false,
      switches: {}
    },
    "/opening-days-start": {
      on: true,
      switches: {
        "Some days": {
          "/opening-days-some": true
        },
        "Irregular days": {
          "/opening-days-irregular": true
        }
      }
    },
    "/opening-days-some": {
      on: false,
      switches: {}
    },
    "/opening-days-irregular": {
      on: false,
      switches: {}
    },
    "/customer-type": {
      on: true,
      switches: {}
    },
    "/business-type": {
      on: true,
      switches: {}
    },
    "/business-import-export": {
      on: true,
      switches: {}
    },
    "/business-other-details": {
      on: true,
      switches: {}
    },
    "/registration-summary": {
      on: true,
      switches: {}
    },
    "/declaration": {
      on: true,
      switches: {}
    }
  }
};
