const seedNewPath = async env => {
  // find and save path config into a file locally before replacement
  pathConfigCollection = configDB.collection("pathConfig");
  const existingPathConfigCursor = await pathConfigCollection.find({});
  const existingPathConfigData = await existingPathConfigCursor.toArray();
  saveDataLocally(
    existingPathConfigData,
    `${env}-pathConfigBeforeReplacement-${new Date()}`
  );

  // add the new entry
  await pathConfigCollection.insert(newPath());

  // find and log all updated path config
  const pathConfigSearchResult = await pathConfigCollection.find({});
  await pathConfigSearchResult.forEach(info);
};

const seedNewNotify = async env => {
  // find and save Notify config into a file locally before replacement
  notifyConfigCollection = configDB.collection("notifyConfig");
  const existingNotifyConfigCursor = await notifyConfigCollection.find({});
  const existingNotifyConfigData = await existingNotifyConfigCursor.toArray();
  saveDataLocally(
    existingNotifyConfigData,
    `${env}-notifyConfigBeforeReplacement-${new Date()}`
  );

  // add the new entry
  await notifyConfigCollection.insert(newNotify());

  // find and log all updated Notify config
  const notifyConfigSearchResult = await notifyConfigCollection.find({});
  await notifyConfigSearchResult.forEach(info);
};

module.exports = { seedNewPath, seedNewNotify };
