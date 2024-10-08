const { logEmitter } = require("../../services/logging.service");
const { isISO8601 } = require("validator");
const { getCouncilsForSupplier } = require("../../connectors/configDb/configDb.connector");

const validateString = (value) => {
  return typeof value === "string";
};

const validateBoolean = (value) => {
  return typeof value === "boolean";
};

const validateBooleanString = (value) => {
  const validValues = ["true", "false"];
  return validValues.includes(value);
};

const allowedFields = ["metadata", "establishment"];
const validateFields = (value) => {
  if (!Array.isArray(value)) {
    return false;
  }
  // Checks allowedFields.includes for every element of array. Array.every returns true for empty array
  return value.every((val) => allowedFields.includes(val));
};

const validateArray = (value) => {
  return Array.isArray(value);
};

const dateRange = (afterValue, beforeValue) => {
  const after = new Date(afterValue);
  let before = new Date(beforeValue);
  before.setDate(before.getDate() - 7);

  return after >= before;
};

const validateDateTime = (value) => {
  if (!validateString(value)) {
    return false;
  }
  return isISO8601(value, { strict: true });
};

const dateTimeFormat = "yyyy-MM-ddTHH:mm:ssZ";

const validationFields = {
  subscriber: {
    function: validateString,
    message: "subscriber option must be a string"
  },

  new: {
    function: validateBooleanString,
    message: "new option must be a boolean"
  },
  fields: {
    function: validateFields,
    message: `fields options must be the from the following list: ${allowedFields}`
  },
  collected: {
    function: validateBoolean,
    message: "collected option must be a boolean"
  },
  fsa_rn: {
    function: validateString,
    message: "fsa_rn option must be a string"
  },
  before: {
    function: validateDateTime,
    message: `before option must be a valid ISO 8601 date and time ('${dateTimeFormat}')`
  },
  after: {
    function: validateDateTime,
    message: `after option must be a valid ISO 8601 date and time ('${dateTimeFormat}')`
  },
  dateRange: {
    message: "range between before and after options must be less than 7 days"
  },
  requestedCouncil: {
    function: validateString,
    message: "local-authority option must be a string"
  },
  requestedCouncils: {
    function: validateArray,
    message: "requested local-authorities must be a valid list of local authorities"
  },
  authorizedCouncils: {
    message: "requested local-authorities must only contain authorized local authorities"
  }
};

const validateOptions = async (options, unlimitedDateRange) => {
  logEmitter.emit("functionCall", "collections.service", "validateOptions");

  for (const key in options) {
    // Check if the validation function for each key returns true or false for the associated value
    if (!validationFields[key].function(options[key])) {
      return raiseValidationError(validationFields[key].message);
    }
  }

  // validate date range
  if (
    !unlimitedDateRange &&
    options.before &&
    options.after &&
    !dateRange(options.after, options.before)
  ) {
    return raiseValidationError(validationFields["dateRange"].message);
  }

  // validate subscriber has access to requested councils
  const requestedCouncils = options.requestedCouncil
    ? [options.requestedCouncil]
    : options.requestedCouncils;
  // This should always be true due to previous validation
  if (options.subscriber && requestedCouncils && requestedCouncils.length > 0) {
    // No need to validate if council is just looking for their own registrations
    if (requestedCouncils.length > 1 || requestedCouncils[0] !== options.subscriber) {
      const validCouncils = await getCouncilsForSupplier(options.subscriber);
      if (
        !requestedCouncils.every(function (val) {
          return validCouncils.indexOf(val) >= 0;
        })
      ) {
        return raiseValidationError(validationFields["authorizedCouncils"].message);
      }
    }
  }

  logEmitter.emit("functionSuccess", "collections.service", "validateOptions");
  return true;
};

const raiseValidationError = (message) => {
  logEmitter.emit("functionFail", "collections.service", "validateOptions", new Error(message));
  return message;
};

module.exports = { validateOptions };
