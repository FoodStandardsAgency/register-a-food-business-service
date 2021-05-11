const { logEmitter } = require("../../services/logging.service");
const { isISO8601 } = require("validator");

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

const doubleModes = ["success", "fail", "update", "single", ""];
const validateDoubleMode = (value) => {
  return doubleModes.includes(value);
};

const allowedFields = ["metadata", "establishment"];
const validateFields = (value) => {
  if (!Array.isArray(value)) {
    return false;
  }
  // Checks allowedFields.includes for every element of array. Array.every returns true for empty array
  return value.every((val) => allowedFields.includes(val));
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
  council: {
    function: validateString,
    message: "council option must be a string"
  },
  double_mode: {
    function: validateDoubleMode,
    message: `double mode option must be one of ${doubleModes}`
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
  }
};

const validateOptions = (options, unlimitedDateRange) => {
  logEmitter.emit("functionCall", "registrations.service", "validateOptions");

  for (const key in options) {
    // Check if the validation function for each key returns true or false for the associated value
    if (!validationFields[key].function(options[key])) {
      return raiseValidationError(validationFields[key].message);
    }
  }

  if (
    !unlimitedDateRange &&
    options.before &&
    options.after &&
    !dateRange(options.after, options.before)
  ) {
    return raiseValidationError(validationFields["dateRange"].message);
  }
  logEmitter.emit(
    "functionSuccess",
    "registrations.service",
    "validateOptions"
  );
  return true;
};

const raiseValidationError = (message) => {
  logEmitter.emit(
    "functionFail",
    "registrations.service",
    "validateOptions",
    new Error(message)
  );
  return message;
};

module.exports = { validateOptions };
