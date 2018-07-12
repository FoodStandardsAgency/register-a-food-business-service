Feature: Contact Details

Contact details section validation

#    Scenario: Entering invalid email without @ symbol
#     Given I enter an email address without an @ symbol
#     When I submit the email to the back end application
#     Then I get an email error response

#     Scenario: Entering invalid email with two @ symbols
#     Given I enter an email address with two @ symbols
#     When I submit the email to the back end application
#     Then I get an email error response


#     Scenario: Entering invalid mobile number with too many digits
#     Given I enter a mobile number longer than 11 digits long
#     When I submit the mobile number to the back end application
#     Then I get an invalid phone number response

#     Scenario: Entering multiple phone numbers longer than 11 digits long
#     Given I enter multiple phone numbers longer than 11 digits long
#     When I submit the mobile number to the back end application
#     Then I get multiple invalid phone number responses

#      Scenario: Entering a phone number with 11 characters including a space, but less than 11 digits
#     Given I enter a mobile number exactly 11 characters long including spaces, but with less than 11 digits
#     When I submit the mobile number that includes a space to the back end application
#     Then I get an error response for mobile due to the space
