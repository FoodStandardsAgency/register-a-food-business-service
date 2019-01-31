/**
 * Functions for transforming user submitted data into the notify e-mail pdf attachment
 * @module services/pdf
 */

const PdfPrinter = require("pdfmake/src/printer");

const {
  docDefinitionGenerator,
  fontDescriptors,
  createTitle,
  createNewSpace,
  createSingleLine,
  createGreyLine,
  createFsaRnBox,
  createLcContactSection
} = require("./pdf-styles");

/**
 * Function that does data manipulation to return an object with data in the needed format
 *
 * @param {object} registrationData The object containing all the answers the user has submitted during the sesion
 * @param {object} postRegistrationData The object containing all the metadata from the submission e.g. fsa-rn number, submission time
 * @param {object} lcContactConfig The object containing the local council information
 *
 * @returns {object} An object containing the set of data in the correct format for the pdf service
 */

const transformDataForPdf = (
  registrationData,
  postRegistrationData,
  lcContactConfig
) => {
  const lcInfo = getLcNames(lcContactConfig);
  const pdfData = {
    operator: { ...registrationData.establishment.operator },
    establishment: {
      ...registrationData.establishment.establishment_details,
      ...registrationData.establishment.premise
    },
    activities: { ...registrationData.establishment.activities },
    declaration: { ...registrationData.metadata },
    metaData: { ...postRegistrationData, lcInfo }
  };
  return pdfData;
};

const convertKeyToDisplayName = key =>
  key.charAt(0).toUpperCase() +
  key
    .slice(1)
    .split("_")
    .join(" ");

const getLcNames = lcContactConfig => {
  const lcInfo = {};
  if (lcContactConfig.hygieneAndStandards) {
    lcInfo.local_council = lcContactConfig.hygieneAndStandards.local_council;
  } else {
    lcInfo.local_council_hygiene = lcContactConfig.hygiene.local_council;
    lcInfo.local_council_standards = lcContactConfig.standards.local_council;
  }
  return lcInfo;
};

const createSingleSection = (title, sectionData) => {
  let section = [];
  section.push(createTitle(title, "h2"));
  section = section.concat(createGreyLine());

  for (let key in sectionData) {
    const displayKey = convertKeyToDisplayName(key);
    const newLine = createSingleLine(displayKey, sectionData[key]);
    section = section.concat(newLine);
  }
  return section;
};

const createContent = pdfData => {
  let content = [];
  content.push(createTitle("New food business registration received", "h1"));
  content.push(createNewSpace(2));
  content = content.concat(createLcContactSection(pdfData.metaData.lcInfo));
  content.push(createNewSpace(2));
  content.push(
    createTitle(
      "You have recieved a new food business registration. The registration details are included in this email. The new registration should also be available on your management information system.",
      "h4"
    )
  );
  content.push(createNewSpace(2));
  content = content.concat(
    createFsaRnBox(pdfData.metaData["fsa-rn"], pdfData.metaData.lcInfo)
  );
  content.push(createNewSpace(2));
  content.push(createTitle("Registration details", "bigger"));
  content.push(createNewSpace(2));
  content.push(
    createSingleLine("Submitted on", pdfData.metaData.reg_submission_date)
  );
  content.push(createSingleSection("Operator details", pdfData.operator));
  content.push(
    createSingleSection("Establishment details", pdfData.establishment)
  );
  content.push(createSingleSection("Activities", pdfData.activities));
  content.push(createSingleSection("Declaration", pdfData.declaration));
  return content;
};

/**
 * Function that uses http://pdfmake.org to convert the data into a base64 string which is what notify uses to create the pdf template
 *
 * @param {object} pdfData An object containing the set of data in the correct format for the pdf service

 * @returns {base64Pdf} Encoded strng that Notify service can use to create the PDF
 */

const pdfGenerator = pdfData => {
  return new Promise(resolve => {
    const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));
    const printer = new PdfPrinter(clonedFontDes);
    const content = createContent(pdfData);
    const clonedDocDef = docDefinitionGenerator(content);
    const pdfMake = printer.createPdfKitDocument(clonedDocDef);

    const segmentsOfPdf = [];

    const convertToBase64 = () => {
      const result = Buffer.concat(segmentsOfPdf);
      const base64Pdf = result.toString("base64");
      resolve(base64Pdf);
    };

    pdfMake.on("data", segment => {
      segmentsOfPdf.push(segment);
    });

    pdfMake.on("end", convertToBase64);
    pdfMake.end();
  });
};

module.exports = { pdfGenerator, transformDataForPdf, convertKeyToDisplayName };
