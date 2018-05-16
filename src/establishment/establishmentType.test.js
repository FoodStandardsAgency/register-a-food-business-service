const { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList } = require('graphql');
const establishmentType = require('./establishmentType');

describe('Establishment', () => {
  it('Should have and ID field with type GraphQLID', () => {
    expect(establishmentType.getFields()).toHaveProperty('id');
    expect(establishmentType.getFields().id.type).toBe(GraphQLID);
  });
})