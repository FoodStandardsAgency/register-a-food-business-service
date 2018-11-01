const { docDefinitionGenerator, fontDescriptors } = require("./pdf-config");
const PdfPrinter = require("pdfmake/src/printer");

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
    declaration: { ...registrationData.establishment.metadata },
    metaData: { ...postRegistrationData, ...lcInfo }
  };
  return pdfData;
};

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

const createLcContactSection = lcInfo => {
  const lcContactSection = [];
  if (lcInfo.local_council) {
    lcContactSection.push({
      text: [
        {
          text: lcInfo.local_council,
          style: "h2"
        }
      ]
    });
  } else {
    lcContactSection.push({
      text: [
        {
          text: lcInfo.local_council_hygiene,
          style: "h2"
        }
      ]
    });
    lcContactSection.push({
      text: [
        {
          text: "Responsible local council for food hygiene",
          style: "h3"
        }
      ]
    });
    lcContactSection.push(createDoubleSpace());
    lcContactSection.push({
      text: [
        {
          text: lcInfo.local_council_standards,
          style: "h2"
        }
      ]
    });
    lcContactSection.push({
      text: [
        {
          text: "Responsible local council for food standards",
          style: "h3"
        }
      ]
    });
  }
};

const createSingleLine = (key, value) => ({
  style: "h4",
  columns: [
    {
      width: "*",
      text: key
    },
    {
      width: "*",
      style: "header",
      text: value
    }
  ]
});

const createTitle = title => ({
  style: "h2",
  columns: [
    {
      width: "*",
      text: title
    }
  ]
});

const createGreyLine = () => ({
  canvas: [
    {
      type: "rect",
      x: 1,
      y: 1,
      w: 505,
      h: 1,
      color: "#808080"
    }
  ]
});

const createNewSpace = () => "\n";
const createDoubleSpace = () => "\n\n";
const convertKeyToDisplayName = key =>
  key.charAt(0).toUpperCase() +
  key
    .slice(1)
    .split("_")
    .join(" ");

const createSingleSection = (title, sectionData) => {
  const section = [];
  section.push(createTitle(title));
  section.push(createNewSpace());
  section.push(createGreyLine());
  section.push(createDoubleSpace());
  //Loop through section data creating a single line for each

  for (let key in sectionData) {
    const displayKey = convertKeyToDisplayName(key);
    const newLine = createSingleLine(displayKey, sectionData[key]);
    section.push(newLine);
  }

  section.push(createDoubleSpace());

  return section;
};

const pdfGenerator = pdfData => {
  return new Promise((resolve, reject) => {
    const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));
    const printer = new PdfPrinter(clonedFontDes);
    const clonedDocDef = docDefinitionGenerator(data);
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

module.exports = { pdfGenerator };
