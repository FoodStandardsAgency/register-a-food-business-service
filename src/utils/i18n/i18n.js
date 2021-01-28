const en = require("./en.json");
const cy = require("./cy.json");
const enLocalAuthorities = require("./en.localAuthorities.json");
const cyLocalAuthorities = require("./cy.localAuthorities.json");

module.exports = class i18n {
  constructor(language) {
    this.language = language;
    this.translations = language === "cy" ? cy : en;
    this.laTranslations =
      language === "cy" ? cyLocalAuthorities : enLocalAuthorities;
  }
  t(key) {
    if (this.translations && this.translations[key]) {
      return this.translations[key];
    }
    return key;
  }
  tLa(key) {
    if (this.laTranslations && this.laTranslations[key]) {
      return this.laTranslations[key];
    }
    return key;
  }
};
