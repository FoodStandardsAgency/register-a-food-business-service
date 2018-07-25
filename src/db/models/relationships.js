const setupRelationships = ({
  Registration,
  Establishment,
  Metadata,
  Activities,
  Premise,
  Operator
}) => {
  Registration.hasOne(Establishment);
  Registration.hasOne(Metadata);
  Establishment.belongsTo(Registration);
  Metadata.belongsTo(Registration);
  Establishment.hasOne(Activities);
  Establishment.hasOne(Premise);
  Establishment.hasOne(Operator);
  Activities.belongsTo(Establishment);
  Premise.belongsTo(Establishment);
  Activities.belongsTo(Establishment);
};

module.exports = { setupRelationships };
