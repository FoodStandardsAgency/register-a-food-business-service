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

const createNewSpace = x => {
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

const createFsaRnBox = (fsarnNumber, lcInfo) => {
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

const createLcContactSection = lcInfo => {
  const lcContactSection = [];
  if (lcInfo.local_council) {
    lcContactSection.push(createTitle(lcInfo.local_council, "h2"));
  } else {
    lcContactSection.push(createTitle(lcInfo.local_council_hygiene, "h2"));
    lcContactSection.push(
      createTitle("Responsible local council for food hygiene", "h3")
    );
    lcContactSection.push(createNewSpace(1));
    lcContactSection.push(createTitle(lcInfo.local_council_standards, "h2"));
    lcContactSection.push(
      createTitle("Responsible local council for food standards", "h3")
    );
  }
  return lcContactSection;
};

const docDefinitionGenerator = content => {
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
  createLcContactSection
};
