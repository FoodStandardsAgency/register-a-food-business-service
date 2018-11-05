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
    metaData: { ...postRegistrationData, lcInfo }
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
    lcContactSection.push(createNewSpace(1));
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
  return lcContactSection;
};

const createSingleLine = (key, value) => {
  let singleLine = [];
  singleLine.push({
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
  singleLine = singleLine.concat(createGreyLine());
  return singleLine;
};

const createTitle = title => {
  const titleArray = [];
  titleArray.push({
    style: "h2",
    columns: [
      {
        width: "*",
        text: title
      }
    ]
  });
  return titleArray;
};

const createGreyLine = () => {
  const greyLineArray = [];
  greyLineArray.push(createNewSpace(1));
  greyLineArray.push({
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
  greyLineArray.push(createNewSpace(1));
  return greyLineArray;
};

const createFsaRnBox = (fsarnNumber, lcInfo) => {
  const fsaRnBox = [];
  const yPositionText = lcInfo.hygieneAndStandards ? 360 : 290;
  const yPositionNumber = lcInfo.hygieneAndStandards ? 395 : 325;
  fsaRnBox.push({
    canvas: [
      {
        type: "rect",
        x: 1,
        y: 1,
        w: 505,
        h: 125,
        r: 4,
        color: "#28a197",
        alignment: "center"
      }
    ]
  });
  fsaRnBox.push({
    text: [
      {
        text: "The unique food business registration number is",
        color: "white",
        fontSize: 16
      }
    ],
    absolutePosition: { x: 30, y: yPositionText },
    alignment: "center"
  });
  fsaRnBox.push({
    text: fsarnNumber,
    absolutePosition: { x: 30, y: yPositionNumber },
    style: "code"
  });
  fsaRnBox.push(createNewSpace(2));
  return fsaRnBox;
};

const createNewSpace = x => {
  let newLine = "";
  for (let i = 1; i <= x; i++) {
    newLine = newLine.concat("\n");
  }
  return newLine;
};

const convertKeyToDisplayName = key =>
  key.charAt(0).toUpperCase() +
  key
    .slice(1)
    .split("_")
    .join(" ");

const createSingleSection = (title, sectionData) => {
  let section = [];
  section.push(createTitle(title));
  section = section.concat(createGreyLine());
  //Loop through section data creating a single line for each

  for (let key in sectionData) {
    const displayKey = convertKeyToDisplayName(key);
    const newLine = createSingleLine(displayKey, sectionData[key]);
    section = section.concat(newLine);
  }
  return section;
};

const createContent = pdfData => {
  let content = [];
  content.push({
    text: [
      {
        text: "New food business registration received",
        style: "h1"
      }
    ]
  });
  content.push(createNewSpace(2));
  content = content.concat(createLcContactSection(pdfData.metaData.lcInfo));
  content.push(createNewSpace(2));
  content.push({
    text: [
      {
        text:
          "You have recieved a new food business registration. The registration details are included in this email. The new registration should also be available on your management information system.",
        style: "h4"
      }
    ]
  });
  content.push(createNewSpace(2));
  content = content.concat(
    createFsaRnBox(pdfData.metaData["fsa-rn"], pdfData.metaData.lcInfo)
  );
  content.push(createNewSpace(2));
  content.push({
    style: "bigger",
    text: "Registration details"
  });
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

module.exports = { pdfGenerator, transformDataForPdf };
