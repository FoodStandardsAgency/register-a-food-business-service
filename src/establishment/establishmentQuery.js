const { GraphQLList } = require('graphql');
const establishmentType = require('./establishmentType');

const establishments = {
  type: new GraphQLList(establishmentType),
  resolve: () => {
    return [{
      id: 1,
      operator_mobile_numbers: ['123'],
      operator_home_numbers: ['123'],
      operator_work_numbers: ['123'],
      operator_text_phone_numbers: ['123'],
      operator_type_talk_numbers: ['123'],
      operator_email: 'email@email.com'
    }]
  }
}

module.exports = { establishments };