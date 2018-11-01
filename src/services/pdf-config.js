const path = require("path");

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

const docDefinitionGenerator = content => {
  const docDefinition = {
    pageSize: "A4",
    content: content,
    styles: {
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
    },

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

// const doc = docDefinitionGenerator({ operator_type: "hi" });
// console.log(typeof doc);

module.exports = { docDefinitionGenerator, fontDescriptors, createTitle };
