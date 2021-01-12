const addressSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      addressline1: { type: "string" },
      addressline2: { type: "string" },
      addressline3: { type: "string" },
      summaryline: { type: "string" },
      organisation: { type: "string" },
      buildingname: { type: "string" },
      premise: { type: "string" },
      posttown: { type: "string" },
      county: { type: "string" },
      postcode: { type: "string" },
      uprn: { type: "string" }
    }
  }
};

module.exports = addressSchema;
