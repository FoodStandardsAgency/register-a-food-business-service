const doubleResponse = {
  "fsa-rn": "DOUBLE-TEST"
};

const registrationDouble = (doubleMode) => {
  if (doubleMode === "success") {
    return doubleResponse;
  } else if (doubleMode === "fail") {
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
