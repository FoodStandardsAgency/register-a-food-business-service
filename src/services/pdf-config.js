const path = require("path");

const findExistingKey = data => {
  const existingKeyList = [];
  for (let item in data) {
    if (item.indexOf("local") === -1) {
      if (data[item] === "yes") {
        const existingKey = item.slice(0, -7);
        existingKeyList.push(existingKey);
      }
    }
  }
  return existingKeyList;
};

const newLineCreator = (existingKeyList, data) => {
  const newLines = [];
  for (let existingKey in existingKeyList) {
    newLines.push({
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
    newLines.push("\n\n");
    newLines.push({
      style: "h4",
      columns: [
        {
          width: "*",
          text:
            existingKeyList[existingKey].charAt(0).toUpperCase() +
            existingKeyList[existingKey]
              .slice(1)
              .split("_")
              .join(" ")
        },
        {
          width: "*",
          style: "header",
          text: data[existingKeyList[existingKey]]
        }
      ]
    });
    newLines.push("\n\n");
  }
  return newLines;
};

const docDefinitionGenerator = data => {
  const existingKeyList = findExistingKey(data);
  const docDefinition = {
    pageSize: "A4",
    content: [
      {
        text: [
          {
            text: "New food business registration received",
            style: "h1"
          }
        ]
      },
      "\n\n",
      {
        text: [
          {
            text: "West Dorset District Council",
            style: "h2"
          }
        ]
      },
      {
        text: [
          {
            text: "Responsible local council for food hygiene",
            style: "h3"
          }
        ]
      },
      "\n\n",
      {
        text: [
          {
            text: "Dorset County Council",
            style: "h2"
          }
        ]
      },
      {
        text: [
          {
            text: "Responsible local council for food standards",
            style: "h3"
          }
        ]
      },
      "\n\n",
      {
        text: [
          {
            text:
              "You have recieved a new food business registration. The registration details are included in this email. The new registration should also be available on your management information system.",
            style: "h4"
          }
        ]
      },
      "\n\n\n",
      {
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
      },
      {
        text: [
          {
            text: "The unique food business registration number is",
            color: "white",
            fontSize: 16
          }
        ],
        absolutePosition: { x: 30, y: 360 },
        alignment: "center"
      },
      {
        text: "F3KEQE - G6JESF - QKMNFN",
        absolutePosition: { x: 30, y: 395 },
        style: "code"
      },
      "\n\n\n",
      {
        style: "bigger",
        text: "Registration details"
      },
      newLineCreator(existingKeyList, data),
      {
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
      },
      "\n",
      {
        style: "h2",
        columns: [
          {
            width: "*",
            text: "Declaration"
          }
        ]
      },
      "\n",
      {
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
      },
      "\n",
      {
        style: "h4",
        columns: [
          {
            width: "*",
            text:
              "I declare that the information I \n have  given on this form is \n correct and complete to the \n best of my knowledge and \n belief."
          },
          {
            width: "*",
            style: "header",
            text: "Accepted"
          }
        ]
      },
      "\n",
      {
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
      },
      "\n",
      {
        style: "h4",
        columns: [
          {
            width: "*",
            text:
              "I, or the operator, will notify \n food authorities of any \n significant changes to business \n activites, including closure, \n withing 28 days if the change \n happening."
          },
          {
            width: "*",
            style: "header",
            text: "Accepted"
          }
        ]
      },
      "\n",
      {
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
      },
      "\n",
      {
        style: "h4",
        columns: [
          {
            width: "*",
            text:
              "I, or the operator, understands \n the operator is legally \n responsible for the safety and \n authenticity of the food being \n produced or served at this \n establishment."
          },
          {
            width: "*",
            style: "header",
            text: "Accepted"
          }
        ]
      },
      "\n",
      {
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
      }
    ],
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

module.exports = { docDefinitionGenerator, fontDescriptors };
