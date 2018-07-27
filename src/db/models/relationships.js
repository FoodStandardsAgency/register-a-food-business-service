const setupRelationships = ({
  Registration,
  Establishment,
  Metadata,
  Activities,
  Premise,
  Operator
}) => {
  Establishment.belongsTo(Registration);
  Metadata.belongsTo(Registration);
  Operator.belongsTo(Establishment);
  Premise.belongsTo(Establishment);
  Activities.belongsTo(Establishment);
};

module.exports = { setupRelationships };
