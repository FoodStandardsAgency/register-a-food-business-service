const i18n = require("./i18n");

var result;

describe("Function: t", () => {
  describe("given the request is for english translation", () => {
    beforeEach(() => {
      const i18nUtil = new i18n("en");
      result = i18nUtil.t("Registration details");
    });

    it("should return the english translation", () => {
      expect(result).toEqual("Registration details");
    });
  });

  describe("given the request is for welsh translation", () => {
    beforeEach(() => {
      const i18nUtil = new i18n("cy");
      result = i18nUtil.t("Registration details");
    });

    it("should return the welsh translation", () => {
      expect(result).toEqual("Manylion cofrestru");
    });
  });
});
