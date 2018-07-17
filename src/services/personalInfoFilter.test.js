const { personalInfoFilter } = require("./personalInfoFilter");

describe("Function: personalInfoFilter", () => {
  it("Should return an object", () => {
    const response = personalInfoFilter();
    expect(typeof response).toBe("object");
  });

  it("Should remove all personal items from object", () => {
    const establishment = {
      operator_first_name: "Steve",
      operator_last_name: "Jobs",
      operator_first_line: "123",
      operator_street: "Fake St",
      operator_town: "Random Town",
      operator_postcode: "SE1 9PZ",
      operator_primary_number: "35445646",
      operator_email: "some@email.com",
      establishment_trading_name: "Business",
      establishment_first_line: "123",
      establishment_street: "Fake St",
      establishment_town: "Random Town",
      establishment_postcode: "SE1 9DD",
      establishment_primary_number: "3435876",
      establishment_email: "some@email.com",
      declaration1: "declaration",
      declaration2: "declaration",
      declaration3: "declaration"
    };

    const response = personalInfoFilter(establishment);

    expect(response).toEqual({
      establishment_trading_name: "Business",
      establishment_first_line: "123",
      establishment_street: "Fake St",
      establishment_town: "Random Town",
      establishment_postcode: "SE1 9DD",
      declaration1: "declaration",
      declaration2: "declaration",
      declaration3: "declaration"
    });
  });
});
