const doubleResponse = {
  "fsa-rn": "DOUBLE-TEST",
  reg_submission_date: "2020-01-01",
  directLcSubmission: true,
  createdAt: "2020-01-01T00:00:00+00:00",
  updatedAt: "2020-01-01T00:00:00+00:00",
  lc_config: {
    hygieneAndStandards: {
      code: 1234,
      local_council: "Double Council",
      local_council_notify_emails: ["double@doubletest.com"],
      local_council_email: "double@doubletest.com",
      country: "england",
      hasAuth: false,
      local_council_phone_number: "01234 123456"
    }
  }
};

const registrationDouble = (double_mode) => {
  if (double_mode === "success") {
    return doubleResponse;
  } else if (double_mode === "fail") {
    const newError = new Error();
    newError.name = "doubleFail";
    newError.message = `Fail requested`;
    throw newError;
  } else {
    throw new Error(
      "Registration double, double mode is undefined or not supported"
    );
  }
};

module.exports = { registrationDouble, doubleResponse };
