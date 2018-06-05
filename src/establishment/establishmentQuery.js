const { GraphQLList } = require("graphql");
const establishmentType = require("./establishmentType");

const establishments = {
  type: new GraphQLList(establishmentType),
  resolve: () => {
    return [
      {
        id: 1,
        operator_mobile_numbers: ["123"],
        operator_home_numbers: ["123"],
        operator_work_numbers: ["123"],
        operator_text_phone_numbers: ["123"],
        operator_type_talk_numbers: ["123"],
        operator_email: "email@email.com",
        establishment_first_line: "123",
        establishment_street: "Street Road",
        establishment_town: "London",
        establishment_postcode: "SW2"
      }
    ];
  }
};

module.exports = { establishments };
