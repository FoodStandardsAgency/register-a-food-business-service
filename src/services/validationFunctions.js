const {
    isEmpty,
    isNumeric
} = require("validator");

const validatePhoneNumber = phoneNumber => {
    if (typeof phoneNumber === "string") {
        phoneNumber = phoneNumber.split(' ').join('');
        if (phoneNumber.startsWith("+")) {
            phoneNumber = phoneNumber.substring(1);
        }
        return isNumeric(phoneNumber) ? true : false;
    }
    return false;
};

const validatePhoneNumberOptional = phoneNumber => {
    if (typeof phoneNumber === "string") {
        if (isEmpty(phoneNumber)) return true;
        return validatePhoneNumber(phoneNumber);
    }
    return false;
};

module.exports = {
    validatePhoneNumber,
    validatePhoneNumberOptional
}