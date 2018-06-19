const {
    validatePhoneNumber,
    validatePhoneNumberOptional
} = require("./validationFunctions");

describe("Function: validate primary contact number", () => {
    it("Should return false when type is not string", () => {
        // Arrange
        const badNumber = [[], {}, null, undefined];
        // Act
        badNumber.forEach(number => {
            // Assert
            const valid = validatePhoneNumber(number);
            expect(valid).toBe(false);
        });
    });

    it("Should return true when the input is non-empty and numeric", () => {
        //Arrange
        const goodNumber = ["447462458575", "2874827482", "110248940242920"];
        //Act
        goodNumber.forEach(number => {
            //Assert
            const valid = validatePhoneNumber(number);
            expect(valid).toBe(true);
        });
    });

    it("Should remove the plus from the beginning of a number", () => {
        //Arrange
        const goodNumber = "+54875875";
        //Act
        const valid = validatePhoneNumber(goodNumber);
        //Assert
        expect(valid).toBe(true);
    });

    it("Should return false if string is empty or contains only blank chars", () => {
        //Arrange
        const badNumbers = ["", " ", "       "];
        //Act
        badNumbers.forEach(number => {
            //Assert
            const valid = validatePhoneNumber(number);
            expect(valid).toBe(false);
        });

    });

    it("Should return false if string contains non numeric characters", () => {
        //Arrange
        const badNumbers = ["djdheiu7373", "wuyewixx@$", ".+()-9w"];
        //Act
        badNumbers.forEach(number => {
            //Assert
            const valid = validatePhoneNumber(number);
            expect(valid).toBe(false);
        });
    });
});

describe("Function: validate secondary contact", () => {
    it("Should return false when type is not string", () => {
        // Arrange
        const badNumber = [[], {}, null, undefined];
        // Act
        badNumber.forEach(number => {
            // Assert
            const valid = validatePhoneNumberOptional(number);
            expect(valid).toBe(false);
        });
    });

    it("Should return true when the input is non-empty and numeric", () => {
        //Arrange
        const goodNumber = ["447462458575", "2874827482", "110248940242920"];
        //Act
        goodNumber.forEach(number => {
            //Assert
            const valid = validatePhoneNumberOptional(number);
            expect(valid).toBe(true);
        });
    });

    it("Should remove the plus from the beginning of a number", () => {
        //Arrange
        const goodNumber = "+54875875";
        //Act
        const valid = validatePhoneNumber(goodNumber);
        //Assert
        expect(valid).toBe(true);
    });

    it("Should return true when input is empty", () => {
        // Arrange
        const phoneNumber = "";
        // Act
        const valid = validatePhoneNumberOptional(phoneNumber);
        //Assert
        expect(valid).toBe(true);
    });


    it("Should return false if string contains non numeric characters", () => {
        //Arrange
        const badNumbers = ["djdheiu7373", "wuyewixx@$", ".+()-9w"];
        //Act
        badNumbers.forEach(number => {
            //Assert
            const valid = validatePhoneNumberOptional(number);
            expect(valid).toBe(false);
        });
    });
});