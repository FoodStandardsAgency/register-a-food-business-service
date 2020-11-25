const {
  operatorTypeEnum,
  establishmentTypeEnum,
  customerTypeEnum,
  waterSupplyEnum,
  importExportEnum
} = require("@slice-and-dice/register-a-food-business-validation");

const OperatorTypeMapping = operatorTypeEnum;

const EstablishmentTypeMapping = establishmentTypeEnum;

const CustomerTypeMapping = customerTypeEnum;

const ImportExportActivitiesMapping = importExportEnum;

const WaterSupplyMapping = waterSupplyEnum;

// Some v1 values different from v2 values in enum so need hard coded data here.
const BusinessTypesMapping = {
  "001": { key: "001", value: "Fruit and vegetable farm" },
  "002": { key: "002", value: "Livestock farm" },
  "003": { key: "003", value: "Arable farm" },
  "004": { key: "004", value: "Beekeeper" },
  "005": { key: "005", value: "Honey maker" },
  "006": { key: "006", value: "Hunting and trapping" },
  "007": { key: "007", value: "Egg processor" },
  "008": { key: "008", value: "Egg producer or packer" },
  "009": { key: "009", value: "Fishing boat" },
  "010": { key: "010", value: "Fish farm" },
  "011": { key: "011", value: "Meat product manufacturer" },
  "012": { key: "012", value: "Abattoir" },
  "013": { key: "013", value: "Fish and shellfish product manufacturer" },
  "014": { key: "014", value: "Shellfish purification centre" },
  "015": { key: "015", value: "Potato product manufacturer" },
  "016": { key: "016", value: "Fruit and vegetable juice manufacturer" },
  "017": { key: "017", value: "Fruit and vegetable product manufacturer" },
  "018": { key: "018", value: "Oil and/or fat manufacturer" },
  "019": { key: "019", value: "Dairies and cheese manufacturer" },
  "020": { key: "020", value: "Ice cream manufacturer" },
  "021": { key: "021", value: "Commercial Bakery" },
  "022": { key: "022", value: "Ready to eat meals or food manufacturer" },
  "023": { key: "023", value: "Dietic or baby food manufacturer" },
  "024": { key: "024", value: "Manufacturer of other food products" },
  "025": { key: "025", value: "Alcoholic drinks manufacturer" },
  "026": { key: "026", value: "Non alcoholic drinks manufacturer" },
  "027": { key: "027", value: "Mineral water packer" },
  "028": { key: "028", value: "Contract packer" },
  "029": { key: "029", value: "Food delivery service" },
  "030": { key: "030", value: "Food ordering service" },
  "031": { key: "031", value: "Food storage facility" },
  "032": { key: "032", value: "Food broker" },
  "033": { key: "033", value: "Wholesaler" },
  "034": { key: "034", value: "Cash and carry" },
  "035": { key: "035", value: "Haulage company" },
  "036": { key: "036", value: "Online retailer" },
  "037": { key: "037", value: "Supermarket" },
  "038": { key: "038", value: "Local convenience store or corner shop" },
  "039": { key: "039", value: "Farm gate sales" },
  "040": { key: "040", value: "Farm shop" },
  "041": { key: "041", value: "Sweet shop or Confectioner" },
  "042": { key: "042", value: "Butcher" },
  "043": { key: "043", value: "Fishmonger" },
  "044": { key: "044", value: "Greengrocer" },
  "045": { key: "045", value: "Health food shop" },
  "046": { key: "046", value: "Bakery" },
  "047": { key: "047", value: "Newsagent or Post Office" },
  "048": { key: "048", value: "Market stalls with permanent pitch" },
  "049": { key: "049", value: "Off licence" },
  "050": { key: "050", value: "Petrol station or garage" },
  "051": { key: "051", value: "Delicatessen" },
  "052": { key: "052", value: "Chemist" },
  "053": { key: "053", value: "Any other retailer" },
  "054": { key: "054", value: "Vending machine" },
  "055": { key: "055", value: "Restaurant, cafe, canteen or fast food" },
  "056": { key: "056", value: "Hostel or bed and breakfast" },
  "057": { key: "057", value: "Hotel" },
  "058": { key: "058", value: "Pub serving meals" },
  "059": { key: "059", value: "Pub serving only snacks and drinks" },
  "060": { key: "060", value: "Take away with no food consumed on site" },
  "061": { key: "061", value: "Nursing home, care home or day centre" },
  "062": { key: "062", value: "Hospital" },
  "063": { key: "063", value: "Childminder" },
  "064": { key: "064", value: "Childcare, nursery or play group" },
  "065": { key: "065", value: "Educational establishment" },
  "066": { key: "066", value: "Mobile retailer" },
  "067": { key: "067", value: "Mobile caterer" },
  "068": { key: "068", value: "Movable food establishment" },
  "069": { key: "069", value: "Contract caterer" },
  "070": { key: "070", value: "Home caterer" },
  "071": { key: "071", value: "Meat cutting plant or commercial butcher" },
  "072": { key: "072", value: "Food auction hall" }
};

module.exports = {
  BusinessTypesMapping,
  OperatorTypeMapping,
  EstablishmentTypeMapping,
  CustomerTypeMapping,
  WaterSupplyMapping,
  ImportExportActivitiesMapping
};
