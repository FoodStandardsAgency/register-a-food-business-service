const {
  validateDeclaration,
  validatePostCode,
  validateOptionalString,
  validateMandatoryString,
  validateName,
  validateEstablishmentTradingName,
  validatePhoneNumber,
  validatePhoneNumberOptional,
  validateEmail,
  validateRadioButtons,
  validateCompanyName,
  validateCompaniesHouseNumber,
  validateCharityName,
  validateCharityNumber,
  validateBusinessType,
  validateDate,
  validateBusinessScale,
  validateFoodType,
  validateProcessingActivities,
  validateOperatorType,
  validateBusinessOtherDetails,
  validateOpeningDaysIrregular,
  validateOpeningDay,
  validatePartnersHasPrimaryContact,
  validatePartnerIsPrimaryContact,
  validatePartnerName,
  validateOpeningHours,
  validateWaterSupply,
  validateFsaReferenceNumber,
  validateWebAddress
} = require("@slice-and-dice/register-a-food-business-validation");

const schema = {
  registration: {
    type: "object",
    properties: {
      establishment: {
        type: "object",
        properties: {
          establishment_trading_name: {
            type: "string",
            validation: validateEstablishmentTradingName
          },
          establishment_primary_number: {
            type: "string",
            validation: validatePhoneNumber
          },
          establishment_secondary_number: {
            type: "string",
            validation: validatePhoneNumberOptional
          },
          establishment_email: {
            type: "string",
            validation: validateEmail
          },
          establishment_web_address: {
            type: "string",
            validation: validateWebAddress
          },
          establishment_opening_date: {
            type: "string",
            validation: validateDate
          },
          operator: {
            type: "object",
            properties: {
              partners: {
                type: "array",
                validation: validatePartnersHasPrimaryContact,
                items: {
                  type: "object",
                  properties: {
                    partner_name: {
                      type: "string",
                      validation: validatePartnerName
                    },
                    partner_is_primary_contact: {
                      type: "boolean",
                      validation: validatePartnerIsPrimaryContact
                    }
                  }
                }
              },
              operator_first_name: {
                type: "string",
                validation: validateName
              },
              operator_last_name: {
                type: "string",
                validation: validateName
              },
              operator_birthdate: {
                type: "string",
                validation: validateDate
              },
              operator_postcode: {
                type: "string",
                validation: validatePostCode
              },
              operator_address_line_1: {
                type: "string",
                validation: validateMandatoryString
              },
              operator_address_line_2: {
                type: "string",
                validation: validateOptionalString
              },
              operator_address_line_3: {
                type: "string",
                validation: validateOptionalString
              },
              operator_town: {
                type: "string",
                validation: validateMandatoryString
              },
              operator_uprn: {
                type: "string",
                validation: validateOptionalString
              },
              operator_primary_number: {
                type: "string",
                validation: validatePhoneNumber
              },
              operator_secondary_number: {
                type: "string",
                validation: validatePhoneNumberOptional
              },
              operator_email: {
                type: "string",
                validation: validateEmail
              },
              contact_representative_name: {
                type: "string",
                validation: validateName
              },
              contact_representative_role: {
                type: "string",
                validation: validateOptionalString
              },
              contact_representative_number: {
                type: "string",
                validation: validatePhoneNumber
              },
              contact_representative_email: {
                type: "string",
                validation: validateEmail
              },
              operator_type: {
                type: "string",
                validation: validateOperatorType
              },
              operator_company_name: {
                type: "string",
                validation: validateCompanyName
              },
              operator_companies_house_number: {
                type: "string",
                validation: validateCompaniesHouseNumber
              },
              operator_charity_name: {
                type: "string",
                validation: validateCharityName
              },
              operator_charity_number: {
                type: "string",
                validation: validateCharityNumber
              }
            },
            required: [
              "operator_address_line_1",
              "operator_type",
              "operator_town",
              "operator_postcode"
            ],
            allOf: [
              {
                oneOf: [
                  {
                    required: ["operator_company_name", "operator_companies_house_number"]
                  },
                  { required: ["operator_charity_name"] },
                  {
                    required: ["operator_first_name", "operator_last_name", "operator_birthdate"]
                  },
                  { required: ["partners"] }
                ]
              },
              {
                oneOf: [
                  {
                    required: ["operator_primary_number", "operator_email"]
                  },
                  {
                    required: ["contact_representative_email", "contact_representative_number"]
                  }
                ]
              }
            ]
          },
          premise: {
            type: "object",
            properties: {
              establishment_postcode: {
                type: "string",
                validation: validatePostCode
              },
              establishment_address_line_1: {
                type: "string",
                validation: validateMandatoryString
              },
              establishment_address_line_2: {
                type: "string",
                validation: validateOptionalString
              },
              establishment_address_line_3: {
                type: "string",
                validation: validateOptionalString
              },
              establishment_town: {
                type: "string",
                validation: validateMandatoryString
              },
              establishment_uprn: {
                type: "string",
                validation: validateOptionalString
              },
              establishment_type: {
                type: "string",
                validation: validateRadioButtons
              }
            },
            required: [
              "establishment_postcode",
              "establishment_address_line_1",
              "establishment_type",
              "establishment_town"
            ]
          },
          activities: {
            type: "object",
            properties: {
              business_type: {
                type: "string",
                validation: validateBusinessType
              },
              business_type_search_term: {
                type: "string",
                validation: validateOptionalString
              },
              business_scale: {
                type: "array",
                validation: validateBusinessScale
              },
              food_type: {
                type: "array",
                validation: validateFoodType
              },
              processing_activities: {
                type: "array",
                validation: validateProcessingActivities
              },
              water_supply: {
                type: "string",
                validation: validateWaterSupply
              },
              business_other_details: {
                type: "string",
                validation: validateBusinessOtherDetails
              },
              opening_days_irregular: {
                type: "string",
                validation: validateOpeningDaysIrregular
              },
              opening_day_monday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_tuesday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_wednesday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_thursday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_friday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_saturday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_day_sunday: {
                type: "boolean",
                validation: validateOpeningDay
              },
              opening_hours_monday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_tuesday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_wednesday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_thursday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_friday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_saturday: {
                type: "string",
                validation: validateOpeningHours
              },
              opening_hours_sunday: {
                type: "string",
                validation: validateOpeningHours
              }
            },
            required: [
              "business_type",
              "business_scale",
              "food_type",
              "processing_activities",
              "water_supply"
            ],
            oneOf: [
              {
                required: [
                  "opening_day_monday",
                  "opening_day_tuesday",
                  "opening_day_wednesday",
                  "opening_day_thursday",
                  "opening_day_friday",
                  "opening_day_saturday",
                  "opening_day_sunday"
                ]
              },
              { required: ["opening_days_irregular"] }
            ]
          }
        },
        required: [
          "establishment_trading_name",
          "establishment_primary_number",
          "establishment_email",
          "establishment_opening_date",
          "operator",
          "premise",
          "activities"
        ]
      },
      metadata: {
        type: "object",
        properties: {
          declaration1: { type: "string", validation: validateDeclaration },
          declaration2: { type: "string", validation: validateDeclaration },
          declaration3: { type: "string", validation: validateDeclaration },
          feedback1: { type: "string", validation: validateDeclaration }
        }
      },
      fsa_rn: { type: "string", validation: validateFsaReferenceNumber }
    },
    required: ["establishment"]
  }
};

module.exports = schema;
