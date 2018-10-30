const { docDefinition, fontDescriptors } = require("./pdf-config");
const PdfPrinter = require("pdfmake/src/printer");

const pdfGenerator = () => {
  return new Promise((resolve, reject) => {
    const clonedFontDes = JSON.parse(JSON.stringify(fontDescriptors));
    const printer = new PdfPrinter(clonedFontDes);
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

module.exports = { pdfGenerator };
