const { createEstablishment } = require("./establishmentResolvers");

describe("Function: createEstablishment", () => {
  it("Should return Establishment Created", () => {
    // Arrange

    // Act
    const response = createEstablishment();

    // Assert
    expect(response).toBe("Establishment Created");
  });
});
