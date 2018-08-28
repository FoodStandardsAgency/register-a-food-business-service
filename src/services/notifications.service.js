const optionalNotifyFields = require("./optional-notify-fields.json");

const transformDataForNotify = (
  registration,
  postRegistrationMetadata,
  lcContactConfig
) => {
  const lcInfo = {};
  if (Object.keys(lcContactConfig).length === 1) {
    lcInfo.local_council = lcContactConfig.hygieneAndStandards.local_council;

    lcInfo.local_council_email =
      lcContactConfig.hygieneAndStandards.local_council_email;
  } else {
    lcInfo.local_council_hygiene = lcContactConfig.hygiene.local_council;

    lcInfo.local_council_email_hygiene =
      lcContactConfig.hygiene.local_council_email;

    lcInfo.local_council_standards = lcContactConfig.standards.local_council;

    lcInfo.local_council_email_standards =
      lcContactConfig.standards.local_council_email;
  }

  const flattenedData = Object.assign(
    {},
    registration.establishment.premise,
    registration.establishment.establishment_details,
    registration.establishment.operator,
    registration.establishment.activities,
    registration.metadata,
    postRegistrationMetadata,
    lcInfo
  );

  optionalNotifyFields.forEach(key => {
    if (flattenedData[key]) {
      flattenedData[`${key}_exists`] = "yes";
    } else {
      flattenedData[key] = "";
      flattenedData[`${key}_exists`] = "no";
    }
  });

  return flattenedData;
};

module.exports = { transformDataForNotify };
