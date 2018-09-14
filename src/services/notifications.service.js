const moment = require("moment");
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

    if (lcContactConfig.hygieneAndStandards.local_council_phone_number) {
      lcInfo.local_council_phone_number =
        lcContactConfig.hygieneAndStandards.local_council_phone_number;
    }
  } else {
    lcInfo.local_council_hygiene = lcContactConfig.hygiene.local_council;

    lcInfo.local_council_email_hygiene =
      lcContactConfig.hygiene.local_council_email;

    if (lcContactConfig.hygiene.local_council_phone_number) {
      lcInfo.local_council_phone_number_hygiene =
        lcContactConfig.hygiene.local_council_phone_number;
    }
    lcInfo.local_council_standards = lcContactConfig.standards.local_council;

    lcInfo.local_council_email_standards =
      lcContactConfig.standards.local_council_email;

    if (lcContactConfig.standards.local_council_phone_number) {
      lcInfo.local_council_phone_number_standards =
        lcContactConfig.standards.local_council_phone_number;
    }
  }

  const registrationClone = JSON.parse(JSON.stringify(registration));

  registrationClone.establishment.establishment_details.establishment_opening_date = moment(
    registrationClone.establishment.establishment_details
      .establishment_opening_date
  ).format("DD MMM YYYY");

  const postRegistrationMetadataClone = JSON.parse(
    JSON.stringify(postRegistrationMetadata)
  );

  postRegistrationMetadataClone.reg_submission_date = moment(
    postRegistrationMetadataClone.reg_submission_date
  ).format("DD MMM YYYY");

  const flattenedData = Object.assign(
    {},
    registrationClone.establishment.premise,
    registrationClone.establishment.establishment_details,
    registrationClone.establishment.operator,
    registrationClone.establishment.activities,
    registrationClone.metadata,
    postRegistrationMetadataClone,
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
