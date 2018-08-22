const mongoClientDouble = {
  find: () => [
    {
      _id: 6008,
      lcName: "Mid & East Antrim Borough Council",
      lcEmails: ["antrim1@email.com", "antrim2@email.com"]
    },
    {
      _id: 4221,
      lcName: "West Dorset District Council",
      lcEmails: ["westdorset@email.com"],
      separateStandardsCouncil: 4226
    },
    {
      _id: 4226,
      lcName: "Dorset County Council",
      lcEmails: ["dorsetcounty@email.com"]
    }
  ]
};

module.exports = { mongoClientDouble };
