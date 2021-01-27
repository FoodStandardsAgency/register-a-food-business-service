const { t } = require("./i18n");

var result;

describe("Function: t", () => {
  describe("given the request is for english translation", () => {
    beforeEach(() => {
      result = t("en", "test");
    });

    it("should return the english translation", () => {
      expect(result).toEqual("english");
    });
  });

  describe("given the request is for welsh translation", () => {
    beforeEach(() => {
      result = t("cy", "test");
    });

    it("should return the welsh translation", () => {
      expect(result).toEqual("welsh");
    });
  });
});
