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
  validateCustomerType,
  validateBusinessType,
  validateDate,
  validateImportExportActivities,
  validateBusinessOtherDetails,
  validateOpeningDaysIrregular,
  validateOpeningDay,
  validatePartnersHasPrimaryContact,
  validatePartnerIsPrimaryContact,
  validatePartnerName,
  validateOpeningHours,
  validateWaterSupply
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
            validation: validatePhoneNumberOptional
          },
          establishment_secondary_number: {
            type: "string",
            validation: validatePhoneNumberOptional
          },
          establishment_email: {
            type: "string",
            validation: validateEmail
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
                validation: validateRadioButtons
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
              "operator_type",
              "operator_postcode",
              "operator_address_line_1"
            ],
            allOf: [
              {
                oneOf: [
                  {
                    required: ["operator_company_name"]
                  },
                  { required: ["operator_charity_name"] },
                  { required: ["operator_first_name", "operator_last_name"] },
                  { required: ["partners"] }
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
                validation: validateOptionalString
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
            required: ["establishment_postcode", "establishment_address_line_1"]
          },
          activities: {
            type: "object",
            properties: {
              customer_type: {
                type: "string",
                validation: validateCustomerType
              },
              business_type: {
                type: "string",
                validation: validateBusinessType
              },
              business_type_search_term: {
                type: "string",
                validation: validateOptionalString
              },
              import_export_activities: {
                type: "string",
                validation: validateImportExportActivities
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
            }
          }
        },
        required: ["establishment_trading_name", "operator", "premise"]
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
      competent_authority_id: { type: "number" },
      fsa_rn: { type: "string" },
      created_at: { type: "date" },
      updated_at: { type: "date" }
    },
    required: ["establishment", "competent_authority_id"]
  }
};

module.exports = schema;
