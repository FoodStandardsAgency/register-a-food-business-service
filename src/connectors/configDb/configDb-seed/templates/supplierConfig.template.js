const supplierTemplate = (seedData) => ({
  _id: Number(seedData.SEED_SUPPLIER_ID),
  supplier_name: seedData.SEED_SUPPLIER_NAME,
  supplier_url: seedData.SEED_SUPPLIER_URL,
  local_councils: seedData.SEED_SUPPLIER_COUNCILS.split(",")
});

module.exports = supplierTemplate;
