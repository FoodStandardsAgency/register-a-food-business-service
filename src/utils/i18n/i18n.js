const { logEmitter } = require("../../services/logging.service");
const en = require("./en.json");
const cy = require("./cy.json");
const enLocalAuthorities = require("./en.localAuthorities.json");
const cyLocalAuthorities = require("./cy.localAuthorities.json");

module.exports = class i18n {
  constructor(language) {
    this.lang = language;
    this.translations = language === "cy" ? cy : en;
    this.laTranslations =
      language === "cy" ? cyLocalAuthorities : enLocalAuthorities;
  }
  language() { return this.lang; }
  t(key) {
    if (this.translations && this.translations[key]) {
      return this.translations[key];
    } else {
      logEmitter.emit(
        "warn",
        `No ${this.lang} translation found for key: ${key}`
      );
    }
    return key;
  }
  tLa(key) {
    if (this.laTranslations && this.laTranslations[key]) {
      return this.laTranslations[key];
    } else {
      logEmitter.emit(
        "warn",
        `No ${this.lang} translation found for key: ${key}`
      );
    }
    return key;
  }
};
