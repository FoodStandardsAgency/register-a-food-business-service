const en = require("./en.json");
const cy = require("./cy.json");

const t = (language, key) => {
  var translations = language === "cy" ? cy : en;
  if (translations && translations[key]) {
    return translations[key];
  }
  return key;
};

module.exports = { t };
