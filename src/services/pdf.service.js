/**
 * Functions for transforming user submitted data into the notify e-mail pdf attachment
 * @module services/pdf
 */

const PdfPrinter = require("pdfmake/src/printer");
const moment = require("moment");

const {
  docDefinitionGenerator,
  fontDescriptors,
  createTitle,
  createNewSpace,
  createSingleLine,
  createGreyLine,
  createFsaRnBox,
  createLcContactSection,
  createGuidanceLinksSection
} = require("./pdf-styles");

const { transformEnumsForService } = require("./transformEnums.service");

/**
 * Function that does data manipulation to return an object with data in the needed format
 *
 * @param {object} registrationData The cached registration data
 * @param {object} lcContactConfig The object containing the local council information
 *
 * @returns {object} An object containing the set of data in the correct format for the pdf service
 */

const transformDataForPdf = (registrationData, lcContactConfig) => {
  const lcInfo = getLcNamesAndCountry(lcContactConfig);

  const operator = { ...registrationData.establishment.operator };
  delete operator.operator_first_line;
  delete operator.operator_street;
  const partners = registrationData.establishment.operator.partners;
  delete operator.partners;
  const premise = { ...registrationData.establishment.premise };
  delete premise.establishment_first_line;
  delete premise.establishment_street;
  const activities = { ...registrationData.establishment.activities };

  moment.locale(
    registrationData.submission_language
      ? registrationData.submission_language
      : "en"
  );
  registrationData.establishment.establishment_details.establishment_opening_date = moment(
    registrationData.establishment.establishment_details
      .establishment_opening_date
  ).format("DD MMM YYYY");

  registrationData.reg_submission_date = moment(
    registrationData.reg_submission_date
  ).format("DD MMM YYYY");

  transformEnumsForService(operator, registrationData.submission_language);
  transformEnumsForService(premise, registrationData.submission_language);
  transformEnumsForService(activities, registrationData.submission_language);

  const pdfData = {
    operator,
    establishment: {
      ...registrationData.establishment.establishment_details,
      ...premise
    },
    activities: activities,
    declaration: { ...registrationData.declaration },
    metaData: { ...registrationData, lcInfo }
  };

  if (Array.isArray(partners)) {
    const partnershipDetails = {
      names: transformPartnersForPdf(partners),
      main_contact: getMainPartnershipContactName(partners)
    };
    pdfData.partnershipDetails = { ...partnershipDetails };
  }

  return pdfData;
};

const transformPartnersForPdf = (partners) => {
  const partnerNames = [];
  for (let partner in partners) {
    partnerNames.push(partners[partner].partner_name);
  }
  return partnerNames.join(", ");
};

const getMainPartnershipContactName = (partners) => {
  const mainPartnershipContact = partners.find((partner) => {
    return partner.partner_is_primary_contact === true;
  });
  return mainPartnershipContact.partner_name;
};

const convertKeyToDisplayName = (key) =>
  key.charAt(0).toUpperCase() + key.slice(1).split("_").join(" ");

const getLcNamesAndCountry = (lcContactConfig) => {
  const lcInfo = {};
  if (lcContactConfig.hygieneAndStandards) {
    lcInfo.local_council = lcContactConfig.hygieneAndStandards.local_council;
    lcInfo.country = lcContactConfig.hygieneAndStandards.country;
  } else {
    lcInfo.local_council_hygiene = lcContactConfig.hygiene.local_council;
    lcInfo.local_council_standards = lcContactConfig.standards.local_council;
    lcInfo.country = lcContactConfig.hygiene.country;
  }
  return lcInfo;
};

const createSingleSection = (title, sectionData, i18n) => {
  let section = [];
  section.push(createTitle(title, "h2"));
  section = section.concat(createGreyLine());

  for (let key in sectionData) {
    const displayKey = convertKeyToDisplayName(key);
    const isValueBoolean = typeof sectionData[key] === "boolean";
    const answer = isValueBoolean
      ? convertBoolToString(sectionData[key])
      : sectionData[key];
    if ((key == "establishment_email" || key == "operator_email") && answer.length >= 35)
    {
      var answerWithBreak = "";
      for(var i = 0; i < answer.length; ++i)
      {
          if(answer[i] == "@")
          {
              answerWithBreak += "\n";
          }
          answerWithBreak += answer[i];
      }
      const newLine = createSingleLine(i18n.t(displayKey), i18n.t(answerWithBreak))
      section = section.concat(newLine);
    }
    else {
      const newLine = createSingleLine(i18n.t(displayKey), i18n.t(answer))
      section = section.concat(newLine);
    }
  }
  return section;
};

const convertBoolToString = (answer) => {
  if (answer === true) {
    return "Yes";
  }
  return "No";
};

const createContent = (pdfData, i18n) => {
  let content = [];
  content.push(
    createTitle(i18n.t("New food business registration received"), "h1")
  );
  content.push(createNewSpace(2));
  content = content.concat(
    createLcContactSection(pdfData.metaData.lcInfo, i18n)
  );
  content.push(createNewSpace(2));
  content.push(
    createTitle(
      i18n.t(
        "You have received a new food business registration. The registration details are included in this email. The new registration should also be available on your management information system."
      ),
      "h4"
    )
  );
  content.push(createNewSpace(2));
  content = content.concat(
    createFsaRnBox(pdfData.metaData["fsa-rn"], pdfData.metaData.lcInfo, i18n)
  );
  content.push(createNewSpace(2));
  content.push(createTitle(i18n.t("Registration details"), "bigger"));
  content.push(createNewSpace(2));
  content.push(
    createSingleLine(
      i18n.t("Submitted on"),
      pdfData.metaData.reg_submission_date
    )
  );
  if (pdfData.partnershipDetails !== undefined) {
    content.push(
      createSingleSection(
        i18n.t("Partnership details"),
        pdfData.partnershipDetails,
        i18n
      )
    );
    content.push(
      createSingleSection(
        i18n.t("Main partnership contact details"),
        pdfData.operator,
        i18n
      )
    );
  } else {
    content.push(
      createSingleSection(i18n.t("Operator details"), pdfData.operator, i18n)
    );
  }
  content.push(
    createSingleSection(
      i18n.t("Establishment details"),
      pdfData.establishment,
      i18n
    )
  );
  content.push(
    createSingleSection(i18n.t("Activities"), pdfData.activities, i18n)
  );
  content.push(
    createSingleSection(i18n.t("Declaration"), pdfData.declaration, i18n)
  );
  content.push(createGuidanceLinksSection(pdfData.metaData.lcInfo, i18n));
  return content;
};

/**
 * Function that uses http://pdfmake.org to convert the data into a base64 string which is what notify uses to create the pdf template
 *
 * @param {object} pdfData An object containing the set of data in the correct format for the pdf service
 * @param {object} i18n Translation utility

 * @returns {base64Pdf} Encoded strng that Notify service can use to create the PDF
 */

const pdfGenerator = (pdfData, i18n) => {
  return new Promise((resolve) => {
    const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));
    const printer = new PdfPrinter(clonedFontDes);
    const content = createContent(pdfData, i18n);
    const clonedDocDef = docDefinitionGenerator(content);
    const pdfMake = printer.createPdfKitDocument(clonedDocDef);

    const segmentsOfPdf = [];

    const convertToBase64 = () => {
      const result = Buffer.concat(segmentsOfPdf);
      const base64Pdf = result.toString("base64");
      resolve(base64Pdf);
    };

    pdfMake.on("data", (segment) => {
      segmentsOfPdf.push(segment);
    });

    pdfMake.on("end", convertToBase64);
    pdfMake.end();
  });
};

module.exports = {
  pdfGenerator,
  transformDataForPdf,
  convertKeyToDisplayName,
  convertBoolToString
};
