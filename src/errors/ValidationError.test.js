const ValidationError = require("./ValidationError");

describe("Constructor: ValidationError", () => {
  it("returns an object with message and custom properties", () => {
    // Arrange
    const errors = [{}];

    // Act
    const response = new ValidationError(errors);

    // Assert
    expect(typeof response).toBe("object");
    expect(response.message).toBeDefined();
    expect(response.state).toBeDefined();
  });

  it("creates error array on state when none exists", () => {
    //Arrange
    const errors = [
      {
        key: "establishment_postcode",
        message: "Invalid establishment postcode"
      }
    ];

    // Act
    const response = new ValidationError(errors);

    // Assert
    expect(response.state.establishment_postcode).toBeDefined();
    expect(response.state.establishment_postcode[0]).toBe(
      "Invalid establishment postcode"
    );
  });

  it("creates multiple error arrays on state when none exists", () => {
    //Arrange
    const errors = [
      {
        key: "establishment_postcode",
        message: "Invalid establishment postcode"
      },
      {
        key: "declaration1",
        message: "Invalid declaration1"
      }
    ];

    // Act
    const response = new ValidationError(errors);

    // Assert
    expect(response.state.establishment_postcode).toBeDefined();
    expect(response.state.establishment_postcode[0]).toBe(
      "Invalid establishment postcode"
    );
    expect(response.state.declaration1).toBeDefined();
    expect(response.state.declaration1[0]).toBe("Invalid declaration1");
  });

  it("creates multiple errors on the same array", () => {
    //Arrange
    const errors = [
      {
        key: "establishment_postcode",
        message: "Invalid establishment postcode"
      },
      {
        key: "establishment_postcode",
        message: "Postcode must not contain symbols"
      }
    ];

    // Act
    const response = new ValidationError(errors);

    // Assert
    expect(response.state.establishment_postcode).toBeDefined();
    expect(response.state.establishment_postcode.length).toBe(2);
    expect(response.state.establishment_postcode[0]).toBe(
      "Invalid establishment postcode"
    );
    expect(response.state.establishment_postcode[1]).toBe(
      "Postcode must not contain symbols"
    );
  });
});
