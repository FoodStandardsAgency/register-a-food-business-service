const seedNewLc = async env => {
  // find and save LC config into a file locally before replacement
  lcConfigCollection = configDB.collection("lcConfig");
  const existingLcConfigCursor = await lcConfigCollection.find({});
  const existingLcConfigData = await existingLcConfigCursor.toArray();
  saveDataLocally(
    existingLcConfigData,
    `${env}-lcConfigBeforeReplacement-${new Date()}`
  );

  // generate the new entry based on the current env
  const newLcEntry = newLc(env);

  // add the new entry
  await lcConfigCollection.insert(newLcEntry);

  // find and log all updated LC config
  const lcConfigSearchResult = await lcConfigCollection.find({});
  await lcConfigSearchResult.forEach(info);
};
module.exports = { seedNewLc };
