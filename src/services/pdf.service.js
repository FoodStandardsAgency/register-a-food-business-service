const PdfPrinter = require("pdfmake/src/printer");
const path = require("path");

const docDefinition = {
  content: [
    {
      canvas: [
        {
          type: "rect",
          x: 1,
          y: 1,
          w: 505,
          h: 185,
          r: 4,
          color: "#28a197",
          alignment: "center"
        }
      ]
    },
    {
      text: [
        { text: "Your unique food business ", color: "white", fontSize: 36 },
        { text: "registration number is", color: "white", fontSize: 36 }
      ],
      absolutePosition: { x: 30, y: 60 },
      alignment: "center"
    },
    {
      text: "F3KEQE - G6JESF - QKMNFN",
      absolutePosition: { x: 30, y: 150 },
      color: "white",
      fontSize: 36,
      bold: true,
      alignment: "center"
    },
    "\n\n\n\n",
    {
      style: "bigger",
      text: "Operator details",
      bold: true
    },
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
      style: "bigger",
      columns: [
        {
          width: "*",
          text: "Operator type"
        },
        {
          width: "*",
          style: "header",
          text: "Sole trader"
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
      style: "bigger",
      columns: [
        {
          width: "*",
          text: "Operator address"
        },
        {
          width: "*",
          style: "header",
          text: "Manor Farm Barns \n Fox Road \n Norwich \n NR14 7PZ"
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
    header: {
      bold: true
    },
    bigger: {
      fontSize: 19
    }
  },

  defaultStyle: {
    columnGap: 20,
    fontSize: 6
  }
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

const pdfGenerator = () => {
  return new Promise((resolve, reject) => {
    const printer = new PdfPrinter(fontDescriptors);
    const clonedDocDef = JSON.parse(JSON.stringify(docDefinition));
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
console.log(pdfGenerator);
module.exports = { pdfGenerator };
