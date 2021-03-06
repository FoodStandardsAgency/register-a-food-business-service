const path = require("path");

const styles = {
  marginStyle: {
    margin: [0, 100]
  },
  header: {
    bold: true
  },
  bigger: {
    fontSize: 19,
    bold: true
  },
  h1: {
    color: "black",
    fontSize: 40,
    bold: true
  },
  h2: {
    fontSize: 15,
    color: "black",
    bold: true
  },
  h3: {
    fontSize: 15,
    color: "#7e8688"
  },
  h4: {
    fontSize: 15,
    color: "black",
    lineHeight: "1.2"
  },
  p: {
    color: "black",
    margin: [20, 0, 40, 0],
    fontSize: 12
  },
  code: {
    color: "white",
    fontSize: 32,
    bold: true,
    alignment: "center"
  }
};

const createTitle = (title, size) => {
  const titleArray = [];
  titleArray.push({
    style: size,
    columns: [
      {
        width: "*",
        text: title
      }
    ]
  });
  return titleArray;
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

const createNewSpace = (x) => {
  let newLine = "";
  for (let i = 1; i <= x; i++) {
    newLine = newLine.concat("\n");
  }
  return newLine;
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

const createFsaRnBox = (fsarnNumber, lcInfo, i18n) => {
  const fsaRnBox = [];
  const yPositionText = lcInfo.local_council ? 285 : 355;
  const yPositionNumber = lcInfo.local_council ? 320 : 390;
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
        text: i18n.t(
          "The unique food business registration application reference is"
        ),
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

const createLcContactSection = (lcInfo, i18n) => {
  const lcContactSection = [];
  if (lcInfo.local_council) {
    lcContactSection.push(createTitle(i18n.tLa(lcInfo.local_council), "h2"));
  } else {
    lcContactSection.push(
      createTitle(i18n.tLa(lcInfo.local_council_hygiene), "h2")
    );
    lcContactSection.push(
      createTitle(i18n.t("Responsible local council for food hygiene"), "h3")
    );
    lcContactSection.push(createNewSpace(1));
    lcContactSection.push(
      createTitle(i18n.tLa(lcInfo.local_council_standards), "h2")
    );
    lcContactSection.push(
      createTitle(i18n.t("Responsible local council for food standards"), "h3")
    );
  }
  return lcContactSection;
};

const createGuidanceLinksSection = (lcInfo, i18n) => {
  const guidanceLinksSectionNoSpaces = [];
  guidanceLinksSectionNoSpaces.push(
    createTitle(i18n.t("Guidance links provided"), "bigger")
  );
  if (lcInfo.country === "wales" || i18n.language() === "cy") {
    guidanceLinksSectionNoSpaces.push(createTitle("English", "h2"));
  }
  guidanceLinksSectionNoSpaces.push(
    createTitle(
      "Guidance on food hygiene and how to run a safe food business: https://www.food.gov.uk/business-guidance",
      "h4"
    )
  );
  guidanceLinksSectionNoSpaces.push(
    createTitle(
      "How to achieve a high food hygiene rating (FHRS score) : https://www.food.gov.uk/business-guidance/food-hygiene-ratings-for-businesses",
      "h4"
    )
  );
  guidanceLinksSectionNoSpaces.push(
    createTitle(
      "Information on the food safety management system safer food, better business: https://www.food.gov.uk/business-guidance/safer-food-better-business",
      "h4"
    )
  );
  guidanceLinksSectionNoSpaces.push(
    createTitle(
      "Food labelling and allergens guidance: https://www.food.gov.uk/business-guidance/industry-specific-advice/labelling-and-allergenss",
      "h4"
    )
  );
  if (lcInfo.country == "england") {
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "Business support & helpline: https://www.gov.uk/business-support-helpline",
        "h4"
      )
    );
  } else if (lcInfo.country === "wales") {
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "Business support: https://www.businesswales.gov.wales/starting-up",
        "h4"
      )
    );
  }

  if (lcInfo.country === "wales" || i18n.language() === "cy") {
    guidanceLinksSectionNoSpaces.push(createTitle("Cymru", "h2"));
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "I gael cyngor cyffredinol ar hylendid bwyd a sut i redeg busnes bwyd diogel: https://www.food.gov.uk/cy/canllawiau-ar-gyfer-busnesau",
        "h4"
      )
    );
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "I gael gwybodaeth am sut i gael sgôr uchel o dan y Cynllun Sgorio Hylendid Bwyd: https://www.food.gov.uk/cy/business-guidance/sgoriau-hylendid-bwyd-ar-gyfer-busnesau",
        "h4"
      )
    );
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "I gael gwybodaeth am y system rheoli diogelwch bwyd, Bwyd mwy Diogel, Busnes Gwell: https://www.food.gov.uk/cy/business-guidance/bwyd-mwy-diogel-busnes-gwell",
        "h4"
      )
    );
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        " I gael canllawiau ar labelu bwyd ac alergenau: https://www.food.gov.uk/cy/canllawiau-ar-gyfer-busnesau/cyngor-penodol-ar-gyfer-y-diwydiant/labelu-ac-alergenau",
        "h4"
      )
    );
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "I gael cyngor busnes cyffredinol: https://businesswales.gov.wales/starting-up/cy",
        "h4"
      )
    );
  } else if (lcInfo.country == "northern-ireland") {
    guidanceLinksSectionNoSpaces.push(
      createTitle(
        "Safe Catering: https://www.food.gov.uk/business-guidance/safe-catering",
        "h4"
      )
    );
    guidanceLinksSectionNoSpaces.push(
      createTitle("Business support: https://www.nibusinessinfo.co.uk/", "h4")
    );
  }
  const guidanceLinksSectiion = [];
  for (let index = 0; index < guidanceLinksSectionNoSpaces.length; index++) {
    guidanceLinksSectiion.push(createNewSpace(2));
    guidanceLinksSectiion.push(guidanceLinksSectionNoSpaces[index]);
  }
  return guidanceLinksSectiion;
};

const docDefinitionGenerator = (content) => {
  const docDefinition = {
    pageSize: "A4",
    content,
    styles,
    defaultStyle: {
      columnGap: 20,
      fontSize: 6
    }
  };
  return docDefinition;
};

const fontDescriptors = {
  Roboto: {
    normal: path.join(
      __dirname,
      "..",
      "/services",
      "/fonts/Roboto-Regular.ttf"
    ),
    bold: path.join(__dirname, "..", "/services", "/fonts/Roboto-Medium.ttf"),
    italics: path.join(
      __dirname,
      "..",
      "/services",
      "/fonts/Roboto-Italic.ttf"
    ),
    bolditalics: path.join(
      __dirname,
      "..",
      "/services",
      "/fonts/Roboto-MediumItalic.ttf"
    )
  }
};

module.exports = {
  docDefinitionGenerator,
  fontDescriptors,
  createGreyLine,
  createTitle,
  createSingleLine,
  createNewSpace,
  createFsaRnBox,
  createLcContactSection,
  createGuidanceLinksSection
};
